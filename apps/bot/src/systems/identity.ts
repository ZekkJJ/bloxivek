import { getCollection, Collections } from '../lib/db.js';
import type { GlobalIdentity, Locale } from '@bloxive/shared';
import { loggers } from '../lib/logger.js';

const log = loggers.identity;

export async function getGlobalIdentity(discordId: string): Promise<GlobalIdentity | null> {
  const collection = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  return collection.findOne({ discord_id: discordId }) as any;
}

export async function ensureGlobalIdentity(discordId: string): Promise<GlobalIdentity> {
  const collection = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  
  let identity = await collection.findOne({ discord_id: discordId }) as any;
  
  if (!identity) {
    const now = new Date();
    const newIdentity = {
      discord_id: discordId,
      roblox_id: null,
      roblox_username: null,
      roblox_avatar_url: null,
      verified_at: null,
      preferred_locale: 'es',
      pps: 500, // Initial score
      pps_breakdown: {
        free_access_nations: 0,
        visa_on_arrival_nations: 0,
        blocked_nations: 0,
        weighted_score: 500,
      },
      platform_sanctions: [],
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(newIdentity as any);
    identity = { ...newIdentity, _id: result.insertedId } as GlobalIdentity;
    log.info({ discordId }, 'Created new global identity');
  }
  
  return identity as any;
}

export async function linkRobloxAccount(
  discordId: string, 
  robloxId: string, 
  username: string, 
  avatarUrl: string | null
): Promise<GlobalIdentity> {
  const collection = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  const now = new Date();
  
  await ensureGlobalIdentity(discordId);
  
  // Check if roblox account is already linked to another discord
  const existing = await collection.findOne({ roblox_id: robloxId, discord_id: { $ne: discordId } });
  if (existing) {
    throw new Error('Roblox account already linked to another Discord user');
  }
  
  const result = await collection.findOneAndUpdate(
    { discord_id: discordId },
    { 
      $set: { 
        roblox_id: robloxId,
        roblox_username: username,
        roblox_avatar_url: avatarUrl,
        verified_at: now,
        updated_at: now,
      } 
    },
    { returnDocument: 'after' }
  );
  
  log.info({ discordId, robloxId, username }, 'Linked Roblox account');
  return result as GlobalIdentity;
}

export async function setPreferredLocale(discordId: string, locale: Locale): Promise<void> {
  const collection = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  await ensureGlobalIdentity(discordId);
  
  await collection.updateOne(
    { discord_id: discordId },
    { 
      $set: { 
        preferred_locale: locale,
        updated_at: new Date(),
      } 
    }
  );
}
