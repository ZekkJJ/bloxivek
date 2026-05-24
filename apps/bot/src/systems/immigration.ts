import { getCollection, Collections } from '../lib/db.js';
import type { ImmigrationEvent, ImmigrationEventType, ImmigrationMethod } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export async function logImmigrationEvent(
  discordId: string,
  guildId: string,
  event: ImmigrationEventType,
  method: ImmigrationMethod,
  officerDiscordId: string | null = null,
  publicNote: string | null = null,
  internalNote: string | null = null
): Promise<void> {
  const collection = getCollection<ImmigrationEvent>(Collections.IMMIGRATION_HISTORY);
  
  const entry: Omit<ImmigrationEvent, '_id'> = {
    discord_id: discordId,
    guild_id: guildId,
    event,
    method,
    officer_discord_id: officerDiscordId,
    public_note: publicNote,
    internal_note: internalNote,
    created_at: new Date()
  };
  
  await collection.insertOne(entry as any);
}

export async function getImmigrationHistory(discordId: string, limit: number = 10): Promise<ImmigrationEvent[]> {
  const collection = getCollection<ImmigrationEvent>(Collections.IMMIGRATION_HISTORY);
  return collection.find({ discord_id: discordId }).sort({ created_at: -1 }).limit(limit).toArray();
}
