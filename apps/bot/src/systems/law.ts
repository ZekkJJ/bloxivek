import { getCollection, Collections, getClient } from '../lib/db.js';
import type { LawCase, Nation, Citizen } from '@bloxive/shared';
import { ObjectId } from 'mongodb';
import { recordTransaction } from './ledger.js';

export async function issueFine(
  guildId: string,
  subjectId: string,
  officerId: string,
  amount: number,
  reason: string,
  nation: Nation,
  approverId: string | null = null
): Promise<LawCase> {
  const casesCol = getCollection<LawCase>(Collections.LAW_CASES);
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  
  const caseNumber = `${nation.currency_name.substring(0, 3).toUpperCase()}-CASE-${Date.now().toString().slice(-6)}`;
  
  const dist = nation.config.law.fine_distribution;
  const treasuryCut = Math.floor(amount * (dist.treasury_pct / 100));
  const officerCut = Math.floor(amount * (dist.officer_pct / 100));
  const departmentCut = amount - treasuryCut - officerCut; // Remainder
  
  const client = getClient();
  const session = client.startSession();
  let finalStatus: 'active' | 'paid' = 'active';
  let lawCase: LawCase | null = null;
  
  try {
    await session.withTransaction(async () => {
      // Create case
      const newCase: Omit<LawCase, '_id'> = {
        case_number: caseNumber,
        guild_id: guildId,
        type: 'fine',
        status: 'active',
        subject_discord_id: subjectId,
        officer_discord_id: officerId,
        approver_discord_id: approverId,
        reason,
        amount,
        paid_at: null,
        arrested_at: null,
        released_at: null,
        released_by: null,
        distribution_executed: null,
        ledger_entry_id: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const insertRes = await casesCol.insertOne(newCase as any, { session });
      lawCase = { ...newCase, _id: insertRes.insertedId } as LawCase;
      
      // Try to pay it immediately
      const subject = await citizensCol.findOneAndUpdate(
        { guild_id: guildId, discord_id: subjectId, wallet: { $gte: amount } },
        { $inc: { wallet: -amount } },
        { session, returnDocument: 'after' }
      );
      
      if (subject) {
        // Has funds, paid
        finalStatus = 'paid';
        
        // Give officer cut
        if (officerCut > 0) {
          await citizensCol.updateOne(
            { guild_id: guildId, discord_id: officerId },
            { $inc: { wallet: officerCut } },
            { session }
          );
          
          await recordTransaction(
            guildId,
            'fine',
            { type: 'citizen', id: subjectId },
            { type: 'citizen', id: officerId },
            officerCut,
            nation.currency_name,
            officerId,
            { case_id: caseNumber, reason: 'Officer cut from fine' },
            `${caseNumber}-officer`
          );
        }
        
        // Treasury cut
        if (treasuryCut > 0) {
          await recordTransaction(
            guildId,
            'fine',
            { type: 'citizen', id: subjectId },
            { type: 'treasury', id: 'treasury' },
            treasuryCut,
            nation.currency_name,
            officerId,
            { case_id: caseNumber, reason: 'Treasury cut from fine' },
            `${caseNumber}-treasury`
          );
        }
        
        // Update case
        const distExec = {
          treasury: treasuryCut,
          officer: officerCut,
          department_fund: departmentCut
        };
        
        await casesCol.updateOne(
          { _id: lawCase._id },
          { 
            $set: { 
              status: 'paid', 
              paid_at: new Date(),
              distribution_executed: distExec
            } 
          },
          { session }
        );
        
        lawCase.status = 'paid';
        lawCase.paid_at = new Date();
        lawCase.distribution_executed = distExec;
      } else {
        // No funds, stays active as debt
        // Bail amount owed on citizen increases if needed? No, fine sits there as active.
      }
    });
  } finally {
    await session.endSession();
  }
  
  return lawCase!;
}

export async function arrestCitizen(
  guildId: string,
  subjectId: string,
  officerId: string,
  reason: string,
  nation: Nation
): Promise<LawCase> {
  const casesCol = getCollection<LawCase>(Collections.LAW_CASES);
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  
  const caseNumber = `${nation.currency_name.substring(0, 3).toUpperCase()}-ARR-${Date.now().toString().slice(-6)}`;
  
  const client = getClient();
  const session = client.startSession();
  let lawCase: LawCase | null = null;
  
  try {
    await session.withTransaction(async () => {
      const citizen = await citizensCol.findOne({ guild_id: guildId, discord_id: subjectId }, { session });
      if (!citizen) throw new Error('Not a citizen');
      if (citizen.active_arrest) throw new Error('Already arrested');
      
      let bailAmount = 0;
      if (nation.config.law.bail_enabled) {
        // Find latest fine
        const latestFine = await casesCol.findOne(
          { guild_id: guildId, subject_discord_id: subjectId, type: 'fine' },
          { sort: { created_at: -1 }, session }
        );
        if (latestFine && latestFine.amount) {
          bailAmount = latestFine.amount * nation.config.law.bail_multiplier;
        }
      }
      
      await citizensCol.updateOne(
        { _id: citizen._id },
        { $set: { active_arrest: true, bail_amount_owed: bailAmount } },
        { session }
      );
      
      const newCase: Omit<LawCase, '_id'> = {
        case_number: caseNumber,
        guild_id: guildId,
        type: 'arrest',
        status: 'active',
        subject_discord_id: subjectId,
        officer_discord_id: officerId,
        approver_discord_id: null,
        reason,
        amount: null,
        paid_at: null,
        arrested_at: new Date(),
        released_at: null,
        released_by: null,
        distribution_executed: null,
        ledger_entry_id: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const insertRes = await casesCol.insertOne(newCase as any, { session });
      lawCase = { ...newCase, _id: insertRes.insertedId } as LawCase;
      
      if (nation.config.law.arrest_bonus_amount > 0) {
        await citizensCol.updateOne(
          { guild_id: guildId, discord_id: officerId },
          { $inc: { wallet: nation.config.law.arrest_bonus_amount } },
          { session }
        );
        await recordTransaction(
          guildId,
          'arrest_bonus',
          { type: 'treasury', id: 'treasury' },
          { type: 'citizen', id: officerId },
          nation.config.law.arrest_bonus_amount,
          nation.currency_name,
          'system',
          { case_id: caseNumber, reason: 'Arrest bonus' },
          `${caseNumber}-bonus`
        );
      }
    });
  } finally {
    await session.endSession();
  }
  
  return lawCase!;
}

export async function releaseCitizen(
  guildId: string,
  subjectId: string,
  releasedBy: string
): Promise<void> {
  const casesCol = getCollection<LawCase>(Collections.LAW_CASES);
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  
  const client = getClient();
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      const activeArrest = await casesCol.findOne(
        { guild_id: guildId, subject_discord_id: subjectId, type: 'arrest', status: 'active' },
        { session }
      );
      
      if (!activeArrest) throw new Error('No active arrest');
      
      await casesCol.updateOne(
        { _id: activeArrest._id },
        { $set: { status: 'released', released_at: new Date(), released_by: releasedBy } },
        { session }
      );
      
      await citizensCol.updateOne(
        { guild_id: guildId, discord_id: subjectId },
        { $set: { active_arrest: false, bail_amount_owed: 0 } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}
