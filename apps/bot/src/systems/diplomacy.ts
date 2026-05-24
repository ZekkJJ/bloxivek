import { getCollection, Collections } from '../lib/db.js';
import type { Alliance, AllianceType, AllianceEffects } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export interface AllianceProposal {
  initiatorGuildId: string;
  partnerGuildId: string;
  type: AllianceType;
  effects: AllianceEffects;
}

export async function proposeAlliance(params: AllianceProposal): Promise<Alliance> {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  
  const newAlliance: Omit<Alliance, '_id'> = {
    initiator_guild_id: params.initiatorGuildId,
    partner_guild_id: params.partnerGuildId,
    type: params.type,
    status: 'pending',
    member_guild_ids: [params.initiatorGuildId, params.partnerGuildId],
    effects: params.effects,
    initiator_accepted_at: new Date(),
    partner_accepted_at: null,
    terminated_at: null,
    terminated_by_guild_id: null,
    termination_reason: null,
    created_at: new Date()
  };
  
  const res = await alliancesCol.insertOne(newAlliance as any);
  return { ...newAlliance, _id: res.insertedId } as Alliance;
}

export async function acceptAlliance(allianceId: string, partnerGuildId: string): Promise<void> {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  
  const result = await alliancesCol.updateOne(
    { _id: new ObjectId(allianceId), partner_guild_id: partnerGuildId, status: 'pending' },
    { $set: { status: 'active', partner_accepted_at: new Date() } }
  );
  
  if (result.matchedCount === 0) throw new Error('Alliance proposal not found or already processed');
}

export async function terminateAlliance(allianceId: string, guildId: string, reason: string): Promise<void> {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  
  const result = await alliancesCol.updateOne(
    { _id: new ObjectId(allianceId), member_guild_ids: guildId, status: 'active' },
    { $set: { status: 'terminated', terminated_at: new Date(), terminated_by_guild_id: guildId, termination_reason: reason } }
  );
  
  if (result.matchedCount === 0) throw new Error('Alliance not found or not active');
}

export async function getAlliances(guildId: string): Promise<Alliance[]> {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  return alliancesCol.find({ member_guild_ids: guildId, status: 'active' }).toArray();
}
