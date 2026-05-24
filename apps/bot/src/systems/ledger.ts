import { getCollection, Collections, getClient } from '../lib/db.js';
import type { LedgerEntry, EntityRef, LedgerType, LedgerMetadata } from '@bloxive/shared';
import { ObjectId } from 'mongodb';
import { loggers } from '../lib/logger.js';

const log = loggers.economy;

export async function recordTransaction(
  guildId: string,
  type: LedgerType,
  from: EntityRef,
  to: EntityRef,
  amount: number,
  currency: string,
  executedBy: string,
  metadata: LedgerMetadata = {},
  idempotencyKey?: string
): Promise<LedgerEntry> {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Transaction amount must be a positive integer');
  }

  const collection = getCollection<LedgerEntry>(Collections.LEDGER);
  const now = new Date();
  const entry: Omit<LedgerEntry, '_id'> = {
    idempotency_key: idempotencyKey ?? new ObjectId().toString(),
    guild_id: guildId,
    type,
    from_entity: from,
    to_entity: to,
    amount,
    currency,
    metadata,
    executed_by_discord_id: executedBy,
    created_at: now,
  };

  const result = await collection.insertOne(entry as any);
  log.info({ guildId, type, amount, from: from.id, to: to.id }, 'Recorded transaction in ledger');
  
  return { ...entry, _id: result.insertedId } as LedgerEntry;
}

export async function transferMoneyWithTransaction(
  guildId: string,
  fromDiscordId: string,
  toDiscordId: string,
  amount: number,
  taxAmount: number,
  currency: string,
  executedBy: string
): Promise<void> {
  const client = getClient();
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      const citizens = getCollection<any>(Collections.CITIZENS);
      
      // Debit sender
      const senderResult = await citizens.findOneAndUpdate(
        { guild_id: guildId, discord_id: fromDiscordId, wallet: { $gte: amount } },
        { $inc: { wallet: -amount } },
        { session, returnDocument: 'after' }
      );
      
      if (!senderResult) {
        throw new Error('Insufficient funds or sender not found');
      }
      
      // Credit receiver (amount minus tax)
      const receiverAmount = amount - taxAmount;
      const receiverResult = await citizens.findOneAndUpdate(
        { guild_id: guildId, discord_id: toDiscordId },
        { $inc: { wallet: receiverAmount } },
        { session }
      );
      
      if (!receiverResult) {
        throw new Error('Receiver not found');
      }
      
      // Record transfer
      await recordTransaction(
        guildId,
        'transfer',
        { type: 'citizen', id: fromDiscordId },
        { type: 'citizen', id: toDiscordId },
        receiverAmount,
        currency,
        executedBy
      );
      
      // Record tax if any
      if (taxAmount > 0) {
        await recordTransaction(
          guildId,
          'tax',
          { type: 'citizen', id: fromDiscordId },
          { type: 'treasury', id: 'treasury' },
          taxAmount,
          currency,
          executedBy
        );
      }
    });
  } finally {
    await session.endSession();
  }
}
