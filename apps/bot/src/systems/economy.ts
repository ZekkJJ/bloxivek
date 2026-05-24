import { getCollection, Collections } from '../lib/db.js';
import type { Citizen, Nation } from '@bloxive/shared';

export async function getCitizen(guildId: string, discordId: string): Promise<Citizen | null> {
  const collection = getCollection<Citizen>(Collections.CITIZENS);
  return collection.findOne({ guild_id: guildId, discord_id: discordId });
}

export async function ensureCitizen(guildId: string, discordId: string): Promise<Citizen> {
  let citizen = await getCitizen(guildId, discordId);
  if (!citizen) {
    throw new Error('Citizen not found. Registration required.');
  }
  return citizen;
}

export function calculateTax(amount: number, nation: Nation): number {
  const taxPct = nation.config.economy.transaction_tax_pct;
  if (taxPct <= 0) return 0;
  
  return Math.floor(amount * (taxPct / 100));
}
