import { Router } from 'express';
import { getCollection, Collections } from '../lib/db.js';
import type { Alliance } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export const diplomacyRouter = Router();

diplomacyRouter.get('/:guildId', async (req, res) => {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  const alliances = await alliancesCol.find({ member_guild_ids: req.params.guildId, status: 'active' }).toArray();
  res.json(alliances);
});

diplomacyRouter.delete('/:guildId/:allianceId', async (req, res) => {
  const alliancesCol = getCollection<Alliance>(Collections.ALLIANCES);
  await alliancesCol.updateOne(
    { _id: new ObjectId(req.params.allianceId), member_guild_ids: req.params.guildId },
    { $set: { status: 'terminated', terminated_at: new Date(), terminated_by_guild_id: req.params.guildId } }
  );
  res.json({ success: true });
});
