import { Router } from 'express';
import { getCollection, Collections } from '../lib/db.js';
import type { LedgerEntry } from '@bloxive/shared';

export const economyRouter = Router();

economyRouter.get('/:guildId/ledger', async (req, res) => {
  const ledgerCol = getCollection<LedgerEntry>(Collections.LEDGER);
  const limit = parseInt(req.query.limit as string) || 50;
  
  const entries = await ledgerCol.find({ guild_id: req.params.guildId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
    
  res.json(entries);
});

economyRouter.get('/:guildId/analytics', async (req, res) => {
  // Real implementation would aggregate ledger data
  res.json({ total_volume: 10000, taxes_collected: 500, inflation_rate: 0.05 });
});
