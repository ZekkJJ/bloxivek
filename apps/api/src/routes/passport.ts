import { Router } from 'express';
import { getCollection, Collections } from '../lib/db.js';
import type { Passport, Visa } from '@bloxive/shared';

export const passportRouter = Router();

passportRouter.get('/:discordId', async (req, res) => {
  const passportsCol = getCollection<Passport>(Collections.PASSPORTS);
  const passports = await passportsCol.find({ discord_id: req.params.discordId, status: 'active' }).toArray();
  res.json(passports);
});

passportRouter.get('/:discordId/visas', async (req, res) => {
  const visasCol = getCollection<Visa>(Collections.VISAS);
  const visas = await visasCol.find({ 
    discord_id: req.params.discordId, 
    status: 'active',
    $or: [ { expires_at: null }, { expires_at: { $gt: new Date() } } ]
  }).toArray();
  res.json(visas);
});
