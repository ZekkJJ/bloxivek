import { bloxiveContainer } from './containers.js';
import type { Citizen, Nation } from '@bloxive/shared';

export function buildEconomyCard(citizen: Citizen, nation: Nation, recentTransactions: any[]) {
  return bloxiveContainer([
    { type: 11, text: `Wallet: ${citizen.wallet} ${nation.currency_symbol}` }
  ]);
}
