import { getCollection, Collections, getClient } from '../lib/db.js';
import type { LedgerEntry } from '@bloxive/shared';
import { recordTransaction } from './ledger.js';
import { loggers } from '../lib/logger.js';

const log = loggers.economy;

export async function depositToTreasury(
  guildId: string,
  fromDiscordId: string,
  amount: number,
  currency: string
): Promise<void> {
  const client = getClient();
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      const citizens = getCollection<any>(Collections.CITIZENS);
      
      const senderResult = await citizens.findOneAndUpdate(
        { guild_id: guildId, discord_id: fromDiscordId, wallet: { $gte: amount } },
        { $inc: { wallet: -amount } },
        { session, returnDocument: 'after' }
      );
      
      if (!senderResult) {
        throw new Error('Insufficient funds');
      }
      
      await recordTransaction(
        guildId,
        'treasury_in',
        { type: 'citizen', id: fromDiscordId },
        { type: 'treasury', id: 'treasury' },
        amount,
        currency,
        fromDiscordId
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function getTreasuryBalance(guildId: string): Promise<number> {
  const ledger = getCollection<LedgerEntry>(Collections.LEDGER);
  
  const transactions = await ledger.find({
    guild_id: guildId,
    $or: [
      { 'to_entity.type': 'treasury' },
      { 'from_entity.type': 'treasury' }
    ]
  }).toArray();
  
  if (transactions.length === 0) return 0;
  
  const balance = transactions.reduce((acc, tx) => {
    if (tx.to_entity.type === 'treasury') {
      return acc + tx.amount;
    } else if (tx.from_entity.type === 'treasury') {
      return acc - tx.amount;
    }
    return acc;
  }, 0);
  
  return balance;
}
