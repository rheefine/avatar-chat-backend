import { Type, Static } from '@sinclair/typebox';

export const ServiceErrorSchema = Type.Object({
  type: Type.Literal('service_error'),
});
export type ServiceError = Static<typeof ServiceErrorSchema>;
