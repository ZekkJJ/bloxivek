import { bloxiveContainer } from './containers.js';
import type { Alliance } from '@bloxive/shared';

export function buildAllianceCard(alliance: Alliance, initiatorNation: any, partnerNation: any) {
  return bloxiveContainer([
    { type: 11, text: `Alliance: ${alliance.type}` }
  ]);
}
