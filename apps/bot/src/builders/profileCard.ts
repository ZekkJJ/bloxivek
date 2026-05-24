import { bloxiveContainer } from './containers.js';
import type { GlobalIdentity, Citizen, Nation } from '@bloxive/shared';

export function buildProfileCard(identity: GlobalIdentity, citizen?: Citizen, nation?: Nation) {
  return bloxiveContainer([
    { type: 11, text: `Profile` }
  ]);
}
