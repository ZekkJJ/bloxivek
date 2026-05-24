import { getCollection, Collections } from '../lib/db.js';
import type { Passport } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export async function issuePassport(discordId: string, guildId: string, citizenNumber: string): Promise<Passport> {
  const collection = getCollection<Passport>(Collections.PASSPORTS);
  
  const existing = await collection.findOne({ discord_id: discordId, issued_by_guild_id: guildId });
  if (existing) {
    if (existing.status !== 'active') {
      await collection.updateOne({ _id: existing._id }, { $set: { status: 'active', issued_at: new Date() } });
      return { ...existing, status: 'active', issued_at: new Date() };
    }
    return existing;
  }
  
  const passport: Omit<Passport, '_id'> = {
    discord_id: discordId,
    issued_by_guild_id: guildId,
    citizen_number: citizenNumber,
    status: 'active',
    issued_at: new Date(),
    expires_at: null
  };
  
  const res = await collection.insertOne(passport as any);
  return { ...passport, _id: res.insertedId } as Passport;
}

export async function getPassports(discordId: string): Promise<Passport[]> {
  const collection = getCollection<Passport>(Collections.PASSPORTS);
  return collection.find({ discord_id: discordId, status: 'active' }).toArray();
}

export async function revokePassport(discordId: string, guildId: string): Promise<void> {
  const collection = getCollection<Passport>(Collections.PASSPORTS);
  await collection.updateOne({ discord_id: discordId, issued_by_guild_id: guildId }, { $set: { status: 'revoked' } });
}
