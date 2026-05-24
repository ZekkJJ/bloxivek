import { MongoClient, Db, Collection } from 'mongodb';

export enum Collections {
  GLOBAL_IDENTITIES = 'global_identities',
  NATIONS = 'nations',
  CITIZENS = 'citizens',
  LEDGER = 'ledger',
  LAW_CASES = 'law_cases',
  PASSPORTS = 'passports',
  VISAS = 'visas',
  IMMIGRATION_HISTORY = 'immigration_history',
  ALLIANCES = 'alliances',
  COMPANIES = 'companies',
  JOBS = 'jobs',
  DNI_TEMPLATES = 'dni_templates',
  AUDIT_LOG = 'audit_log'
}

let dbInstance: Db | null = null;
let clientInstance: MongoClient | null = null;

export function initDb(db: Db, client: MongoClient) {
  dbInstance = db;
  clientInstance = client;
}

export function getDb(): Db {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance;
}

export function getClient(): MongoClient {
  if (!clientInstance) throw new Error('Client not initialized');
  return clientInstance;
}

export function getCollection<T>(name: Collections): Collection<T extends Document ? T : Document & T> {
  return getDb().collection<any>(name);
}
