import { ObjectId } from 'mongodb';

export type CaseType = 'fine' | 'arrest' | 'warrant';
export type CaseStatus = 'active' | 'paid' | 'dismissed' | 'released' | 'expired';

export interface DistributionExecuted {
  treasury: number;
  officer: number;
  department_fund: number;
}

export interface LawCase {
  _id: ObjectId;
  case_number: string; // e.g. "COL-CASE-001847"
  guild_id: string;
  type: CaseType;
  status: CaseStatus;
  subject_discord_id: string;
  officer_discord_id: string;
  approver_discord_id: string | null;
  reason: string;
  amount: number | null; // Only for fines
  paid_at: Date | null;
  arrested_at: Date | null;
  released_at: Date | null;
  released_by: string | null;
  distribution_executed: DistributionExecuted | null;
  ledger_entry_id: ObjectId | null;
  created_at: Date;
  updated_at: Date;
}
