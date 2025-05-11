import { Type, Static } from '@sinclair/typebox';

export const EndSchema = Type.Object({
  type: Type.Literal('end'),
  id: Type.Number(),
});
export type End = Static<typeof EndSchema>;
