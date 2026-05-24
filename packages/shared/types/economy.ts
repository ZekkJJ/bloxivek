import { ObjectId } from 'mongodb';

export type CitizenStatus = 'active' | 'suspended' | 'deported' | 'deceased';

export interface Citizen {
  _id: ObjectId;
  guild_id: string;
  discord_id: string;
  citizen_number: string; // e.g. "COL-00847"
  status: CitizenStatus;
  wallet: number; // Always integer (cents/minimum units) — NEVER float
  bank: number; // 0 if wallet_bank_split = false
  job_id: ObjectId | null;
  company_id: ObjectId | null;
  company_role: string | null;
  government_role_id: string | null;
  active_arrest: boolean;
  bail_amount_owed: number;
  registered_at: Date;
  last_active_at: Date;
}

export type EntityType = 'citizen' | 'treasury' | 'company' | 'system';

export interface EntityRef {
  type: EntityType;
  id: string; // discord_id, 'treasury', company ObjectId string, etc.
}

export type LedgerType = 'transfer' | 'fine' | 'salary' | 'tax' | 'treasury_in' | 'treasury_out' | 'company_payroll' | 'arrest_bonus' | 'bail' | 'fee';

export interface LedgerMetadata {
  case_id?: string;
  officer_discord_id?: string;
  reason?: string;
  command?: string;
  [key: string]: string | undefined;
}

export interface LedgerEntry {
  _id: ObjectId;
  idempotency_key: string;
  guild_id: string;
  type: LedgerType;
  from_entity: EntityRef;
  to_entity: EntityRef;
  amount: number; // Positive integer always — direction indicated by from/to
  currency: string;
  metadata: LedgerMetadata;
  executed_by_discord_id: string;
  created_at: Date;
}
