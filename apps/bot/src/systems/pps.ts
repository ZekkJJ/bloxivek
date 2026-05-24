import { getCollection, Collections } from '../lib/db.js';
import type { GlobalIdentity, Passport, Visa, PlatformSanction, Alliance } from '@bloxive/shared';

export async function calculatePPS(discordId: string): Promise<{ score: number, breakdown: any }> {
  // PPS stands for Passport Power Score. It is calculated dynamically based on the passports a user holds,
  // the alliances their nations have, the active visas they hold, and any sanctions they have.
  
  const passportsCol = getCollection<Passport>(Collections.PASSPORTS);
  const visasCol = getCollection<Visa>(Collections.VISAS);
  const identitiesCol = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  
  const passports = await passportsCol.find({ discord_id: discordId, status: 'active' }).toArray();
  const visas = await visasCol.find({ discord_id: discordId, status: 'active', $or: [ { expires_at: null }, { expires_at: { $gt: new Date() } } ] }).toArray();
  const identity = await identitiesCol.findOne({ discord_id: discordId });
  
  let score = 0;
  let free_access_nations = passports.length; // Base passport count
  let visa_on_arrival_nations = 0;
  let blocked_nations = 0;
  
  // Base passport points
  score += passports.length * 10;
  
  // Alliance free transit access
  for (const p of passports) {
    const alliances = await alliancesCol.find({ member_guild_ids: p.issued_by_guild_id, status: 'active', 'effects.auto_fastpass': true }).toArray();
    for (const a of alliances) {
      free_access_nations += a.member_guild_ids.length - 1; // Partner nations
      score += (a.member_guild_ids.length - 1) * 3;
    }
  }
  
  // Visa points
  score += visas.length * 2;
  
  // Deductions from sanctions
  if (identity && identity.platform_sanctions) {
    const activeSanctions = identity.platform_sanctions.filter(s => s.expires_at === null || s.expires_at > new Date());
    score -= activeSanctions.length * 50; // Severe penalty for conduct sanctions
    blocked_nations += activeSanctions.length;
  }
  
  // Normalize
  score = Math.max(0, Math.min(1000, score));
  
  const breakdown = {
    free_access_nations,
    visa_on_arrival_nations,
    blocked_nations,
    weighted_score: score
  };
  
  if (identity) {
    await identitiesCol.updateOne(
      { _id: identity._id },
      { $set: { pps: score, pps_breakdown: breakdown, updated_at: new Date() } }
    );
  }
  
  return { score, breakdown };
}

export async function recalculateAllPPS(): Promise<{ processed: number }> {
  // Batch processing logic intended for cron jobs
  const identitiesCol = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  const identities = await identitiesCol.find({}).toArray();
  
  for (const id of identities) {
    await calculatePPS(id.discord_id);
  }
  
  return { processed: identities.length };
}
