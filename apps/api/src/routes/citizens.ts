import { Router } from 'express';
import { getCollection, Collections } from '../lib/db.js';
import type { Citizen } from '@bloxive/shared';

export const citizensRouter = Router();

citizensRouter.get('/:guildId', async (req, res) => {
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  const limit = parseInt(req.query.limit as string) || 50;
  
  const citizens = await citizensCol.find({ guild_id: req.params.guildId })
    .limit(limit)
    .toArray();
    
  res.json(citizens);
});

citizensRouter.get('/:guildId/:discordId', async (req, res) => {
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  const citizen = await citizensCol.findOne({ guild_id: req.params.guildId, discord_id: req.params.discordId });
  
  if (!citizen) return res.status(404).json({ error: 'Citizen not found' });
  res.json(citizen);
});

citizensRouter.post('/:guildId/:discordId/deport', async (req, res) => {
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  await citizensCol.updateOne(
    { guild_id: req.params.guildId, discord_id: req.params.discordId },
    { $set: { status: 'deported' } }
  );
  // Full deport logic would clear jobs, companies, arrests, etc.
  res.json({ success: true });
});
