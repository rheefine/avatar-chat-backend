import { Type, Static } from '@sinclair/typebox';

export const VisemeSchema = Type.Object({
  type: Type.Literal('viseme'),
  id: Type.Number(),
  time: Type.Number(),
  value: Type.String(),
});
export type Viseme = Static<typeof VisemeSchema>;
