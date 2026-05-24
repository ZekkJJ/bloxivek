import { bloxiveContainer } from './containers.js';
import type { GlobalIdentity, Passport, Visa, ImmigrationEvent } from '@bloxive/shared';

export function buildPassportCard(identity: GlobalIdentity, passports: Passport[], visas: Visa[], history: ImmigrationEvent[]) {
  // In a real V2 builder we'd construct a rich component object.
  // Returning a stub structure for now that can be sent in Discord payloads.
  return bloxiveContainer([
    { type: 11, text: `Global Passport` },
    { type: 11, text: `PPS: ${identity.pps}` }
  ]);
}
