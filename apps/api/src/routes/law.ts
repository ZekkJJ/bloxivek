import { Router } from 'express';
import { getCollection, Collections } from '../lib/db.js';
import type { Citizen, LawCase } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export const lawRouter = Router();

lawRouter.get('/:guildId/cases', async (req, res) => {
  const casesCol = getCollection<LawCase>(Collections.LAW_CASES);
  const cases = await casesCol.find({ guild_id: req.params.guildId }).sort({ created_at: -1 }).limit(50).toArray();
  res.json(cases);
});

lawRouter.post('/:guildId/cases/:caseId/dismiss', async (req, res) => {
  const casesCol = getCollection<LawCase>(Collections.LAW_CASES);
  await casesCol.updateOne(
    { _id: new ObjectId(req.params.caseId), guild_id: req.params.guildId },
    { $set: { status: 'dismissed' } }
  );
  res.json({ success: true });
});
