import { connect, disconnect, getCollection, Collections } from './lib/db.js';
import { config } from 'dotenv';
config();

async function run() {
  await connect();
  const col = getCollection(Collections.GLOBAL_IDENTITIES);
  const result = await col.updateMany(
    { pps: { $exists: false } },
    { $set: { pps: 500, pps_breakdown: { free_access_nations: 0, visa_on_arrival_nations: 0, blocked_nations: 0, weighted_score: 500 }, platform_sanctions: [], preferred_locale: 'es' } }
  );
  console.log(`Updated ${result.modifiedCount} identities`);
  await disconnect();
}
run().catch(console.error);
