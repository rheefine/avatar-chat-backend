import { Type, Static } from '@sinclair/typebox';

export type Role = 'user' | 'assistant';

export interface MessageEntry {
  sessionID: string;
  id: string;
  role: Role;
  text: string;
  round: number;
  createdAt: number;
  vector?: number[];
}

export type NewMessageEntry = Omit<MessageEntry, 'id' | 'createdAt'>;

export const MessageSearchResultSchema = Type.Object({
  sessionID: Type.String(),
  role: Type.Union([Type.Literal('user'), Type.Literal('assistant')]),
  text: Type.String(),
  round: Type.Number(),
  createdAt: Type.Number(),
});

export type MessageSearchResult = Static<typeof MessageSearchResultSchema>;
