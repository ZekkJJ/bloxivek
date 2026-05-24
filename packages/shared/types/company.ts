import { ObjectId } from 'mongodb';

export type CompanyStatus = 'pending' | 'active' | 'dissolved';
export type JobCategory = 'government' | 'private' | 'gig';
export type ApplicationMode = 'open' | 'application' | 'invitation';
export type SalarySource = 'treasury' | 'company' | 'none';

export interface CompanyRolePermissions {
  can_hire: boolean;
  can_fire: boolean;
  can_view_balance: boolean;
  can_make_payments: boolean;
  can_view_transactions: boolean;
  can_deposit_withdraw: boolean;
}

export interface CompanyRole {
  name: string;
  permissions: CompanyRolePermissions;
}

export interface Company {
  _id: ObjectId;
  guild_id: string;
  name: string;
  type: string;
  status: CompanyStatus;
  owner_discord_id: string;
  wallet: number; // integer
  internal_roles: CompanyRole[];
  max_employees: number;
  current_employee_count: number;
  approved_by: string | null;
  approved_at: Date | null;
  created_at: Date;
}

export interface Job {
  _id: ObjectId;
  guild_id: string;
  name: string;
  description: string;
  salary: number; // 0 = no fixed salary
  salary_source: SalarySource;
  company_id: ObjectId | null;
  category: JobCategory;
  application_mode: ApplicationMode;
  max_holders: number | null;
  current_holders: number;
  is_active: boolean;
  created_by_discord_id: string;
  created_at: Date;
}
