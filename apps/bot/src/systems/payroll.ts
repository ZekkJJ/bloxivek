import { getCollection, Collections, getClient } from '../lib/db.js';
import type { Job, Citizen, Nation } from '@bloxive/shared';
import { recordTransaction } from './ledger.js';
import { getTreasuryBalance } from './treasury.js';
import { loggers } from '../lib/logger.js';
import { ObjectId } from 'mongodb';

const log = loggers.economy;

export async function processGuildPayroll(guildId: string): Promise<{ totalPaid: number, employeesPaid: number, shortfall: number }> {
  log.info({ guildId }, 'Processing payroll for guild');
  
  const jobsCol = getCollection<Job>(Collections.JOBS);
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  const nationsCol = getCollection<Nation>(Collections.NATIONS);
  
  const nation = await nationsCol.findOne({ guild_id: guildId });
  if (!nation) return { totalPaid: 0, employeesPaid: 0, shortfall: 0 };
  
  // Find jobs paid by treasury
  const treasuryJobs = await jobsCol.find({
    guild_id: guildId,
    salary_source: 'treasury',
    is_active: true,
    salary: { $gt: 0 }
  }).toArray();
  
  if (treasuryJobs.length === 0) return { totalPaid: 0, employeesPaid: 0, shortfall: 0 };
  
  const currentTreasuryBalance = await getTreasuryBalance(guildId);
  let remainingTreasury = currentTreasuryBalance;
  
  const client = getClient();
  
  let totalPaid = 0;
  let employeesPaid = 0;
  let shortfall = 0;
  
  for (const job of treasuryJobs) {
    const employees = await citizensCol.find({
      guild_id: guildId,
      job_id: job._id,
      status: 'active'
    }).toArray();
    
    for (const employee of employees) {
      if (remainingTreasury < job.salary) {
        log.warn({ guildId, jobId: job._id, employeeId: employee.discord_id }, 'Insufficient treasury funds for payroll');
        shortfall += job.salary;
        continue;
      }
      
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          // Add funds to employee
          const updateRes = await citizensCol.findOneAndUpdate(
            { _id: employee._id },
            { $inc: { 
                bank: nation.config.economy.wallet_bank_split ? job.salary : 0, 
                wallet: !nation.config.economy.wallet_bank_split ? job.salary : 0 
              } 
            },
            { session, returnDocument: 'after' }
          );
          
          if (!updateRes) throw new Error('Employee not found during payroll');
          
          // Record transaction
          await recordTransaction(
            guildId,
            'salary',
            { type: 'treasury', id: 'treasury' },
            { type: 'citizen', id: employee.discord_id },
            job.salary,
            nation.currency_name,
            'system' // Executed by system cron
          );
        });
        
        remainingTreasury -= job.salary;
        totalPaid += job.salary;
        employeesPaid++;
      } catch (err) {
        log.error({ err, guildId, employeeId: employee.discord_id }, 'Error paying employee');
      } finally {
        await session.endSession();
      }
    }
  }
  
  return { totalPaid, employeesPaid, shortfall };
}
