import { getCollection, Collections } from '../lib/db.js';
import type { GlobalIdentity, PlatformSanction } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export async function issueConductSanction(
  discordId: string,
  guildId: string,
  reason: string,
  durationDays: number | null
): Promise<PlatformSanction> {
  const identitiesCol = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  
  const expiresAt = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;
  
  const sanction: PlatformSanction = {
    id: new ObjectId().toString(),
    reason,
    issued_by_guild_id: guildId,
    issued_at: new Date(),
    expires_at: expiresAt,
    shared_with: []
  };
  
  await identitiesCol.updateOne(
    { discord_id: discordId },
    { $push: { platform_sanctions: sanction } as any, $set: { updated_at: new Date() } },
    { upsert: true }
  );
  
  return sanction;
}

export async function revokeConductSanction(discordId: string, sanctionId: string, guildId: string): Promise<void> {
  const identitiesCol = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  
  await identitiesCol.updateOne(
    { discord_id: discordId },
    { 
      $pull: { platform_sanctions: { id: sanctionId, issued_by_guild_id: guildId } } as any,
      $set: { updated_at: new Date() }
    }
  );
}

export async function checkSanctions(discordId: string, guildId: string): Promise<PlatformSanction[]> {
  const identitiesCol = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
  const identity = await identitiesCol.findOne({ discord_id: discordId });
  if (!identity || !identity.platform_sanctions) return [];
  
  const now = new Date();
  
  // Return sanctions issued by this guild, OR shared with this guild, OR global if severe enough.
  return identity.platform_sanctions.filter(s => {
    if (s.expires_at !== null && s.expires_at < now) return false;
    return s.issued_by_guild_id === guildId || s.shared_with.includes(guildId);
  });
}
