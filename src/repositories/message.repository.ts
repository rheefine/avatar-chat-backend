import { TypeCompiler } from '@sinclair/typebox/compiler';
import {
  MessageEntry,
  NewMessageEntry,
  MessageSearchResultSchema,
} from '#@/entities/message.entity';
import { randomUUID32 } from '#@/utils/random-uuid-32';

import type { createClient } from 'redis';

type Redis = ReturnType<typeof createClient>;
export type Role = 'user' | 'assistant';

interface RawDoc {
  id: string;
  value: unknown;
}
interface RawReply {
  documents: RawDoc[];
}

const checkMessage = TypeCompiler.Compile(MessageSearchResultSchema);

export class MessageRepository {
  constructor(
    private readonly client: Redis,
    private readonly vectorDim: number,
  ) {}

  private messageKey(id: string) {
    return `message:${id}`;
  }

  private vecToBuffer(vec: number[]) {
    if (vec.length !== this.vectorDim)
      throw new Error(`vector dim mismatch: ${vec.length} != ${this.vectorDim}`);
    const buf = Buffer.allocUnsafe(4 * vec.length);
    const view = new DataView(buf.buffer);
    vec.forEach((v, i) => view.setFloat32(i * 4, v, true));
    return buf;
  }

  async create(entry: MessageEntry | NewMessageEntry): Promise<string> {
    const id = 'id' in entry ? entry.id : randomUUID32();
    const ts =
      'createdAt' in entry && typeof entry.createdAt === 'number' ? entry.createdAt : Date.now();

    await this.client.hSet(this.messageKey(id), {
      sessionID: entry.sessionID,
      role: entry.role,
      text: entry.text,
      round: entry.round.toString(),
      createdAt: ts.toString(),
    });

    if ('vector' in entry && entry.vector) {
      await this.updateVector(id, entry.vector);
    }
    return id;
  }

  async read(sessionID: string): Promise<MessageEntry[]> {
    const esc = sessionID.replace(/-/g, '\\-');
    const raw = (await this.client.ft.search('messageIdx', `@sessionID:{${esc}}`, {
      DIALECT: 2,
      SORTBY: 'createdAt',
      LIMIT: { from: 0, size: 100 },
      RETURN: ['sessionID', 'role', 'text', 'round', 'createdAt'],
    })) as unknown as RawReply;

    return raw.documents.map((d) => {
      const rv = d.value as Record<string, unknown>;

      const candidate = {
        sessionID: String(rv.sessionID),
        role: String(rv.role),
        text: String(rv.text),
        round: Number(rv.round),
        createdAt: Number(rv.createdAt),
      };

      if (!checkMessage.Check(candidate)) {
        throw new Error('Invalid message shape from Redisearch');
      }

      return {
        ...candidate,
        id: d.id.replace('message:', ''),
      } as MessageEntry;
    });
  }

  async updateVector(id: string, vec: number[]) {
    const buf = this.vecToBuffer(vec);
    await this.client.hSet(this.messageKey(id), { vector: buf });
  }

  async knnSearch(
    vec: number[],
    beforeRound: number,
    sessionID: string,
    k = 5,
  ): Promise<{ entry: MessageEntry; score: number }[]> {
    const raw = (await this.client.ft.search(
      'messageIdx',
      `(@round:[-inf ${beforeRound}])=>[KNN ${k} @vector $vec AS score]`,
      {
        PARAMS: { sid: sessionID, vec: this.vecToBuffer(vec) },
        SORTBY: 'score',
        RETURN: ['sessionID', 'role', 'text', 'round', 'score', 'createdAt'],
        DIALECT: 2,
      },
    )) as unknown as RawReply;

    return raw.documents.map((d) => {
      const rv = d.value as Record<string, unknown>;
      const candidate = {
        sessionID: String(rv.sessionID),
        role: String(rv.role),
        text: String(rv.text),
        round: Number(rv.round),
        createdAt: Number(rv.createdAt),
      };

      if (!checkMessage.Check(candidate)) {
        throw new Error('Invalid message shape from Redisearch');
      }
      return {
        entry: {
          ...candidate,
          id: d.id.replace('message:', ''),
        },
        score: Number(rv.score),
      };
    });
  }
}
