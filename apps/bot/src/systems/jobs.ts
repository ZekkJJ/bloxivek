import { getCollection, Collections, getClient } from '../lib/db.js';
import type { Job, JobCategory, ApplicationMode, SalarySource, Citizen } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export async function createJob(
  guildId: string,
  name: string,
  description: string,
  salary: number,
  salarySource: SalarySource,
  category: JobCategory,
  applicationMode: ApplicationMode,
  createdByDiscordId: string,
  companyId?: string,
  maxHolders?: number
): Promise<Job> {
  const jobsCol = getCollection<Job>(Collections.JOBS);
  
  const newJob: Omit<Job, '_id'> = {
    guild_id: guildId,
    name,
    description,
    salary,
    salary_source: salarySource,
    company_id: companyId ? new ObjectId(companyId) : null,
    category,
    application_mode: applicationMode,
    max_holders: maxHolders ?? null,
    current_holders: 0,
    is_active: true,
    created_by_discord_id: createdByDiscordId,
    created_at: new Date()
  };
  
  const res = await jobsCol.insertOne(newJob as any);
  return { ...newJob, _id: res.insertedId } as Job;
}

export async function applyForJob(guildId: string, jobId: string, discordId: string): Promise<void> {
  // In a full implementation, this creates a JobApplication document for the company/gov to review.
  // For open application mode, we just assign it.
  const jobsCol = getCollection<Job>(Collections.JOBS);
  const job = await jobsCol.findOne({ _id: new ObjectId(jobId), guild_id: guildId });
  if (!job) throw new Error('Job not found');
  
  if (job.application_mode === 'open') {
    await assignJob(guildId, jobId, discordId);
  } else {
    // Add to pending applications (requires JobApplication collection, stubbed for now)
  }
}

export async function assignJob(guildId: string, jobId: string, discordId: string): Promise<void> {
  const jobsCol = getCollection<Job>(Collections.JOBS);
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  
  const client = getClient();
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId), guild_id: guildId, is_active: true }, { session });
      if (!job) throw new Error('Job not found or inactive');
      if (job.max_holders && job.current_holders >= job.max_holders) throw new Error('Job is full');
      
      const citizen = await citizensCol.findOne({ guild_id: guildId, discord_id: discordId }, { session });
      if (!citizen) throw new Error('Not a citizen');
      
      // If citizen has previous job, decrement its holders
      if (citizen.job_id) {
        await jobsCol.updateOne(
          { _id: citizen.job_id },
          { $inc: { current_holders: -1 } },
          { session }
        );
      }
      
      await citizensCol.updateOne(
        { _id: citizen._id },
        { $set: { job_id: job._id } },
        { session }
      );
      
      await jobsCol.updateOne(
        { _id: job._id },
        { $inc: { current_holders: 1 } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function quitJob(guildId: string, discordId: string): Promise<void> {
  const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
  const jobsCol = getCollection<Job>(Collections.JOBS);
  
  const client = getClient();
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      const citizen = await citizensCol.findOne({ guild_id: guildId, discord_id: discordId }, { session });
      if (!citizen || !citizen.job_id) return;
      
      await jobsCol.updateOne(
        { _id: citizen.job_id },
        { $inc: { current_holders: -1 } },
        { session }
      );
      
      await citizensCol.updateOne(
        { _id: citizen._id },
        { $set: { job_id: null } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function listJobs(guildId: string, filters: any = {}): Promise<Job[]> {
  const jobsCol = getCollection<Job>(Collections.JOBS);
  return jobsCol.find({ guild_id: guildId, is_active: true, ...filters }).toArray();
}
