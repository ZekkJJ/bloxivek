import { getCollection, Collections } from '../lib/db.js';
import type { Visa, VisaType, VisaGrantMethod } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export async function issueVisa(
  discordId: string, 
  targetGuildId: string, 
  issuingGuildId: string,
  type: VisaType,
  grantedBy: VisaGrantMethod,
  grantedByDiscordId: string | null,
  durationDays: number | null,
  allianceId?: string
): Promise<Visa> {
  const collection = getCollection<Visa>(Collections.VISAS);
  
  const expiresAt = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;
  
  const visa: Omit<Visa, '_id'> = {
    discord_id: discordId,
    target_guild_id: targetGuildId,
    issuing_guild_id: issuingGuildId,
    type,
    tier: null,
    status: 'active',
    granted_by: grantedBy,
    granted_by_discord_id: grantedByDiscordId,
    issued_at: new Date(),
    expires_at: expiresAt,
    alliance_id: allianceId ? new ObjectId(allianceId) : null
  };
  
  const res = await collection.insertOne(visa as any);
  return { ...visa, _id: res.insertedId } as Visa;
}

export async function revokeVisa(visaId: string): Promise<void> {
  const collection = getCollection<Visa>(Collections.VISAS);
  await collection.updateOne({ _id: new ObjectId(visaId) }, { $set: { status: 'revoked' } });
}

export async function getActiveVisas(discordId: string): Promise<Visa[]> {
  const collection = getCollection<Visa>(Collections.VISAS);
  return collection.find({ 
    discord_id: discordId, 
    status: 'active',
    $or: [ { expires_at: null }, { expires_at: { $gt: new Date() } } ]
  }).toArray();
}

export async function expireVisas(): Promise<number> {
  const collection = getCollection<Visa>(Collections.VISAS);
  const result = await collection.updateMany(
    { status: 'active', expires_at: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );
  return result.modifiedCount;
}

export async function checkVisaAccess(discordId: string, guildId: string): Promise<Visa | null> {
  const collection = getCollection<Visa>(Collections.VISAS);
  return collection.findOne({
    discord_id: discordId,
    target_guild_id: guildId,
    status: 'active',
    $or: [ { expires_at: null }, { expires_at: { $gt: new Date() } } ]
  });
}
