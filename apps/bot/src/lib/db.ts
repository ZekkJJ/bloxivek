import { MongoClient, Db, Collection, ServerApiVersion, type CreateIndexesOptions, type IndexSpecification, type Document } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connect(): Promise<Db> {
  if (db) return db;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is required');
  
  client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    retryWrites: false,
    retryReads: true,
    w: 'majority',
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  
  await client.connect();
  db = client.db(process.env.MONGODB_DB ?? 'bloxive');
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected. Call connect() first.');
  return db;
}

export function getClient(): MongoClient {
  if (!client) throw new Error('Database not connected. Call connect() first.');
  return client;
}

export function getCollection<T>(name: string): Collection<T extends Document ? T : Document & T> {
  return getDb().collection<any>(name);
}

// Collection names as constants
export const Collections = {
  GLOBAL_IDENTITIES: 'global_identities',
  NATIONS: 'nations',
  CITIZENS: 'citizens',
  LEDGER: 'ledger',
  LAW_CASES: 'law_cases',
  PASSPORTS: 'passports',
  VISAS: 'visas',
  IMMIGRATION_HISTORY: 'immigration_history',
  ALLIANCES: 'alliances',
  COMPANIES: 'companies',
  JOBS: 'jobs',
  DNI_TEMPLATES: 'dni_templates',
  AUDIT_LOG: 'audit_log',
} as const;

interface IndexDefinition {
  collection: string;
  indexes: Array<{
    spec: IndexSpecification;
    options?: CreateIndexesOptions;
  }>;
}

const INDEX_DEFINITIONS: IndexDefinition[] = [
  {
    collection: Collections.GLOBAL_IDENTITIES,
    indexes: [
      { spec: { discord_id: 1 }, options: { unique: true } },
      { spec: { roblox_id: 1 }, options: { unique: true, sparse: true } },
      { spec: { pps: -1 } },
    ],
  },
  {
    collection: Collections.NATIONS,
    indexes: [
      { spec: { guild_id: 1 }, options: { unique: true } },
      { spec: { prestige_tier: 1 } },
      { spec: { prestige_score: -1 } },
    ],
  },
  {
    collection: Collections.CITIZENS,
    indexes: [
      { spec: { guild_id: 1, discord_id: 1 }, options: { unique: true } },
      { spec: { guild_id: 1, status: 1 } },
      { spec: { guild_id: 1, active_arrest: 1 } },
    ],
  },
  {
    collection: Collections.LEDGER,
    indexes: [
      { spec: { idempotency_key: 1 }, options: { unique: true } },
      { spec: { guild_id: 1, created_at: -1 } },
      { spec: { guild_id: 1, 'from_entity.id': 1 } },
      { spec: { guild_id: 1, 'to_entity.id': 1 } },
    ],
  },
  {
    collection: Collections.LAW_CASES,
    indexes: [
      { spec: { guild_id: 1, subject_discord_id: 1, status: 1 } },
      { spec: { guild_id: 1, officer_discord_id: 1, created_at: -1 } },
      { spec: { guild_id: 1, type: 1, status: 1 } },
    ],
  },
  {
    collection: Collections.PASSPORTS,
    indexes: [
      { spec: { discord_id: 1, issued_by_guild_id: 1 }, options: { unique: true } },
      { spec: { discord_id: 1, status: 1 } },
    ],
  },
  {
    collection: Collections.VISAS,
    indexes: [
      { spec: { discord_id: 1, target_guild_id: 1, status: 1 } },
      { spec: { expires_at: 1 } },
    ],
  },
  {
    collection: Collections.IMMIGRATION_HISTORY,
    indexes: [
      { spec: { discord_id: 1, created_at: -1 } },
      { spec: { guild_id: 1, created_at: -1 } },
    ],
  },
  {
    collection: Collections.ALLIANCES,
    indexes: [
      { spec: { initiator_guild_id: 1, partner_guild_id: 1 }, options: { unique: true, sparse: true } },
      { spec: { member_guild_ids: 1 } },
      { spec: { status: 1 } },
    ],
  },
  {
    collection: Collections.COMPANIES,
    indexes: [
      { spec: { guild_id: 1, status: 1 } },
      { spec: { guild_id: 1, owner_discord_id: 1 } },
    ],
  },
  {
    collection: Collections.JOBS,
    indexes: [
      { spec: { guild_id: 1, is_active: 1 } },
      { spec: { guild_id: 1, company_id: 1 } },
    ],
  },
  {
    collection: Collections.DNI_TEMPLATES,
    indexes: [
      { spec: { guild_id: 1 }, options: { unique: true } },
    ],
  },
  {
    collection: Collections.AUDIT_LOG,
    indexes: [
      { spec: { guild_id: 1, created_at: -1 } },
      { spec: { actor_discord_id: 1, created_at: -1 } },
    ],
  },
];

export async function ensureIndexes(): Promise<void> {
  const database = getDb();
  
  for (const def of INDEX_DEFINITIONS) {
    const collection = database.collection(def.collection);
    for (const index of def.indexes) {
      try {
        await collection.createIndex(index.spec, index.options ?? {});
      } catch (err) {
        // Log but don't crash — index might already exist with different options
        console.error(`Failed to create index on ${def.collection}:`, err);
      }
    }
  }
}

export async function disconnect(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
