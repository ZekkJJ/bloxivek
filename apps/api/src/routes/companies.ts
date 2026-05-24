import { Router } from 'express';
import { getCollection, Collections } from '../lib/db.js';
import type { Company } from '@bloxive/shared';

export const companiesRouter = Router();

companiesRouter.get('/:guildId', async (req, res) => {
  const compCol = getCollection<Company>(Collections.COMPANIES);
  const companies = await compCol.find({ guild_id: req.params.guildId }).toArray();
  res.json(companies);
});

companiesRouter.post('/:guildId', async (req, res) => {
  // Bureaucratic mode company creation
  const compCol = getCollection<Company>(Collections.COMPANIES);
  const newComp = req.body; // Needs zod validation
  newComp.guild_id = req.params.guildId;
  newComp.created_at = new Date();
  
  const result = await compCol.insertOne(newComp);
  res.json({ success: true, id: result.insertedId });
});
