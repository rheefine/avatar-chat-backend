import { randomUUID } from 'crypto';

export function randomUUID32() {
  return randomUUID().replace(/-/g, '');
}
