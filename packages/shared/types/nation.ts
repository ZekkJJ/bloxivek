import { ObjectId } from 'mongodb';

export type EconomyMode = 'arcade' | 'realistic';
export type BorderMode = 'open' | 'tier_gated' | 'application' | 'closed';
export type CompanyCreationMode = 'open' | 'semi_open' | 'bureaucratic';
export type PrestigeTier = 'unranked' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'elite';

export interface LeoPermissions {
  can_fine: boolean;
  can_arrest: boolean;
  can_issue_warrant: boolean;
  can_release: boolean;
  can_dismiss_cases: boolean;
}

export interface FineDistribution {
  treasury_pct: number;
  officer_pct: number;
  department_fund_pct: number;
}

export interface EconomyConfig {
  wallet_bank_split: boolean;
  bank_withdraw_fee_pct: number;
  interest_rate_daily_pct: number;
  max_wallet_balance: number | null;
  transaction_tax_pct: number;
  company_creation_mode: CompanyCreationMode;
  company_creation_fee: number;
  max_employees_per_company: number;
  can_citizens_create_jobs: boolean;
}

export interface BorderConfig {
  mode: BorderMode;
  min_pps_entry: number | null;
  auto_fastpass_pps_threshold: number | null;
  auto_fastpass_alliance: boolean;
}

export interface LawConfig {
  leo_roles: string[];
  leo_permissions: Record<string, LeoPermissions>;
  max_fine_without_approval: number;
  max_fines_per_hour_per_officer: number;
  fine_distribution: FineDistribution;
  arrest_bonus_amount: number;
  bail_enabled: boolean;
  bail_multiplier: number;
  unpaid_fine_block_threshold: number | null;
  immune_roles: string[];
}

export interface TreasuryConfig {
  payroll_enabled: boolean;
  payroll_interval_hours: number;
  runway_alert_days: number;
}

export interface ChannelsConfig {
  general: string | null;
  law_log: string | null;
  immigration_log: string | null;
  alliance_log: string | null;
  economy_log: string | null;
  government_alerts: string | null;
}

export interface FeaturesConfig {
  companies_enabled: boolean;
  diplomacy_enabled: boolean;
  interpol_enabled: boolean;
  dni_editor_unlocked: boolean;
  analytics_enabled: boolean;
}

export interface NationConfig {
  mode: EconomyMode;
  economy: EconomyConfig;
  border: BorderConfig;
  law: LawConfig;
  treasury: TreasuryConfig;
  channels: ChannelsConfig;
  features: FeaturesConfig;
}

export interface Nation {
  _id: ObjectId;
  guild_id: string;
  name: string;
  currency_name: string;
  currency_symbol: string;
  flag_url: string | null;
  description: string;
  locale: 'es' | 'en';
  prestige_tier: PrestigeTier;
  prestige_score: number;
  owner_discord_id: string;
  config: NationConfig;
  created_at: Date;
  updated_at: Date;
}
