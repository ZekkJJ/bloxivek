import { Router } from 'express';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';

export const nationsRouter = Router();

nationsRouter.get('/:guildId', async (req, res) => {
  const nationsCol = getCollection<Nation>(Collections.NATIONS);
  const nation = await nationsCol.findOne({ guild_id: req.params.guildId });
  if (!nation) return res.status(404).json({ error: 'Nation not found' });
  res.json(nation);
});

nationsRouter.patch('/:guildId', async (req, res) => {
  const nationsCol = getCollection<Nation>(Collections.NATIONS);
  const updates = req.body;
  
  await nationsCol.updateOne(
    { guild_id: req.params.guildId },
    { $set: updates }
  );
  
  res.json({ success: true });
});
