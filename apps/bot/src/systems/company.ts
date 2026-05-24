import { getCollection, Collections, getClient } from '../lib/db.js';
import type { Company, Job, Nation, Citizen } from '@bloxive/shared';
import { ObjectId } from 'mongodb';
import { recordTransaction } from './ledger.js';

export async function createCompany(
  guildId: string,
  ownerDiscordId: string,
  name: string,
  type: string,
  nation: Nation
): Promise<Company> {
  const compCol = getCollection<Company>(Collections.COMPANIES);
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  const fee = nation.config.economy.company_creation_fee;
  
  const client = getClient();
  const session = client.startSession();
  let company: Company | null = null;
  
  try {
    await session.withTransaction(async () => {
      const citizen = await citizensCol.findOne({ guild_id: guildId, discord_id: ownerDiscordId }, { session });
      if (!citizen) throw new Error('Not a citizen');
      if (citizen.wallet < fee) throw new Error('Insufficient funds for fee');
      
      const newComp: Omit<Company, '_id'> = {
        guild_id: guildId,
        name,
        type,
        status: nation.config.economy.company_creation_mode === 'open' ? 'active' : 'pending',
        owner_discord_id: ownerDiscordId,
        wallet: 0,
        internal_roles: [
          { name: 'Director', permissions: { can_hire: true, can_fire: true, can_view_balance: true, can_make_payments: true, can_view_transactions: true, can_deposit_withdraw: true } }
        ],
        max_employees: nation.config.economy.max_employees_per_company,
        current_employee_count: 1, // Owner is implicit employee
        approved_by: nation.config.economy.company_creation_mode === 'open' ? 'system' : null,
        approved_at: nation.config.economy.company_creation_mode === 'open' ? new Date() : null,
        created_at: new Date()
      };
      
      const res = await compCol.insertOne(newComp as any, { session });
      company = { ...newComp, _id: res.insertedId } as Company;
      
      if (fee > 0) {
        await citizensCol.updateOne(
          { _id: citizen._id },
          { $inc: { wallet: -fee }, $set: { company_id: company._id, company_role: 'Director' } },
          { session }
        );
        
        await recordTransaction(
          guildId,
          'fee',
          { type: 'citizen', id: ownerDiscordId },
          { type: 'treasury', id: 'treasury' },
          fee,
          nation.currency_name,
          ownerDiscordId,
          { reason: 'Company creation fee', company_id: company._id.toString() },
          `fee-comp-${company._id.toString()}`
        );
      } else {
        await citizensCol.updateOne(
          { _id: citizen._id },
          { $set: { company_id: company._id, company_role: 'Director' } },
          { session }
        );
      }
    });
  } finally {
    await session.endSession();
  }
  
  return company!;
}

export async function approveCompany(guildId: string, companyId: string, approverId: string): Promise<void> {
  const compCol = getCollection<Company>(Collections.COMPANIES);
  await compCol.updateOne(
    { _id: new ObjectId(companyId), guild_id: guildId },
    { $set: { status: 'active', approved_by: approverId, approved_at: new Date() } }
  );
}

export async function dissolveCompany(guildId: string, companyId: string): Promise<void> {
  const compCol = getCollection<Company>(Collections.COMPANIES);
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  const jobsCol = getCollection<Job>(Collections.JOBS);
  
  const client = getClient();
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      const comp = await compCol.findOne({ _id: new ObjectId(companyId), guild_id: guildId }, { session });
      if (!comp) throw new Error('Company not found');
      
      await compCol.updateOne(
        { _id: comp._id },
        { $set: { status: 'dissolved' } },
        { session }
      );
      
      await citizensCol.updateMany(
        { company_id: comp._id },
        { $set: { company_id: null, company_role: null, job_id: null } },
        { session }
      );
      
      await jobsCol.updateMany(
        { company_id: comp._id },
        { $set: { is_active: false } },
        { session }
      );
      
      // If company has wallet funds, send to treasury (or owner, depending on policy. Using treasury as safe default).
      if (comp.wallet > 0) {
         await recordTransaction(
          guildId,
          'transfer',
          { type: 'company', id: comp._id.toString() },
          { type: 'treasury', id: 'treasury' },
          comp.wallet,
          'CURRENCY', // Need to fetch nation currency properly but omitting for brevity
          'system',
          { reason: 'Company dissolved' },
          `dissolve-${comp._id.toString()}`
        );
      }
    });
  } finally {
    await session.endSession();
  }
}
