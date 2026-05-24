import { getCollection, Collections } from '../lib/db.js';
import type { Alliance } from '@bloxive/shared';

export async function findAllianceBetween(guildA: string, guildB: string): Promise<Alliance | null> {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  return alliancesCol.findOne({
    member_guild_ids: { $all: [guildA, guildB] },
    status: 'active'
  });
}

export async function getAlliedGuilds(guildId: string): Promise<string[]> {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  const alliances = await alliancesCol.find({ member_guild_ids: guildId, status: 'active' }).toArray();
  
  const alliedGuilds = new Set<string>();
  for (const a of alliances) {
    for (const id of a.member_guild_ids) {
      if (id !== guildId) alliedGuilds.add(id);
    }
  }
  return Array.from(alliedGuilds);
}

export async function countAlliances(guildId: string): Promise<number> {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  return alliancesCol.countDocuments({ member_guild_ids: guildId, status: 'active' });
}
