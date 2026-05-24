import { getCollection, Collections } from '../lib/db.js';
import type { Nation, PrestigeTier } from '@bloxive/shared';

export async function calculatePrestige(guildId: string): Promise<{ score: number, tier: PrestigeTier }> {
  const nationCol = getCollection<Nation>(Collections.NATIONS);
  const nation = await nationCol.findOne({ guild_id: guildId });
  if (!nation) throw new Error('Nation not found');
  
  // Prestige is calculated via population, economy activity, alliances, etc.
  // Using a simplified formula for MVP.
  let score = 0;
  
  // Example metric (in real app, we'd fetch actual counts from citizensCol, ledgerCol, etc)
  score += 150; // Base score
  
  let tier: PrestigeTier = 'unranked';
  if (score >= 1200) tier = 'elite';
  else if (score >= 900) tier = 'diamond';
  else if (score >= 600) tier = 'gold';
  else if (score >= 300) tier = 'silver';
  else if (score >= 100) tier = 'bronze';
  
  await nationCol.updateOne(
    { _id: nation._id },
    { $set: { prestige_score: score, prestige_tier: tier } }
  );
  
  return { score, tier };
}

export async function recalculateAllPrestige(): Promise<{ processed: number }> {
  const nationCol = getCollection<Nation>(Collections.NATIONS);
  const nations = await nationCol.find({}).toArray();
  
  for (const n of nations) {
    await calculatePrestige(n.guild_id);
  }
  
  return { processed: nations.length };
}
