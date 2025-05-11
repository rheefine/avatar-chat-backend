import { AzureLlmEmitEvents } from '#@/adapters/llm/azure/azure-llm-events';

import type { AzureLlmSessionOptions } from '#@/adapters/llm/azure/azure-llm-options.type';

const DEFAULT_RESPONSE_RULES = [
  'RESPONSE RULES',
  '1. You are a helpful, polite, and courteous assistant who speaks in a warm, friendly, and conversational tone.',
  '2. Never say you can’t remember; always use all provided context relevant to the most recent user query when crafting your response.',
  '3. You can use personal details, previous replies, and relevant messages to craft natural, context-aware responses.',
  '4. Start with a single short sentence no longer than 12 Korean characters (≈ 6 English words).',
  '5. From the second sentence onward, continue naturally with no length or format constraints.',
];

const DEFAULT_RELEVANT_DESCRIPTION = (relevantQueries: string[]) => {
  return [
    'The queries below were selected based on embedding similarity to the current question.',
    '--- Top 3 Relevant Queries ---',
    ...relevantQueries,
    'Please refer to this list when crafting your response to provide richer and more accurate information.',
  ];
};

export const AzureLlmMessages = {
  buildSessionInit: (opts: AzureLlmSessionOptions) =>
    ({
      type: AzureLlmEmitEvents.SessionUpdate,
      session: {
        modalities: opts.modalities,
        model: opts.model,
        instructions: DEFAULT_RESPONSE_RULES.join('\n'),
      },
    }) as const,

  buildSessionUpdate: (relevantQueries: string[]) =>
    ({
      type: AzureLlmEmitEvents.SessionUpdate,
      session: {
        instructions: [
          ...DEFAULT_RESPONSE_RULES,
          '',
          ...DEFAULT_RELEVANT_DESCRIPTION(relevantQueries),
        ].join('\n'),
      },
    }) as const,

  buildUserQuery: (userQuery: string, itemID: string) => ({
    type: AzureLlmEmitEvents.ConversationItemCreate,
    item: {
      id: itemID,
      type: 'message' as const,
      role: 'user' as const,
      content: [{ type: 'input_text' as const, text: userQuery }],
    },
  }),
  buildSystemQuery: (relevantQueries: string[]) => ({
    type: AzureLlmEmitEvents.ConversationItemCreate,
    previous_item_id: 'root',
    item: {
      type: 'message' as const,
      role: 'system' as const,
      id: 'system',
      content: [
        {
          type: 'input_text' as const,
          text: [...DEFAULT_RELEVANT_DESCRIPTION(relevantQueries)].join('\n'),
        },
      ],
    },
  }),

  buildDeleteQuery: (id: string) => ({
    type: AzureLlmEmitEvents.ConversationItemDelete,
    item_id: id,
  }),

  buildResponseCreate: (MetaID: string) => ({
    type: AzureLlmEmitEvents.ResponseCreate,
    response: {
      metadata: {
        id: MetaID,
      },
    },
  }),

  buildResponseCancel: () =>
    ({
      type: AzureLlmEmitEvents.ResponseCancel,
    }) as const,
};
