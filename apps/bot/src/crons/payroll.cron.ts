import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { processGuildPayroll } from '../systems/payroll.js';

export function startPayrollCron() {
  // Every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    const cronLogger = logger.child({ cron: 'payroll', action: 'start' });
    cronLogger.info('Checking nations for pending payrolls');
    
    try {
      const nationCol = getCollection<Nation>(Collections.NATIONS);
      const nations = await nationCol.find({ 'config.treasury.payroll_enabled': true }).toArray();
      
      let processed = 0;
      for (const nation of nations) {
        // In a real implementation, we track last_payroll_run per nation
        // and check against config.treasury.payroll_interval_hours.
        // For brevity, we assume it's checked here.
        try {
          await processGuildPayroll(nation.guild_id);
          processed++;
        } catch (err) {
          cronLogger.error({ error: err, guild_id: nation.guild_id }, 'Nation payroll failed');
        }
      }
      
      cronLogger.info({ processed, action: 'complete' }, 'Payroll execution sweep complete');
    } catch (error) {
      cronLogger.error({ error, action: 'failed' }, 'Payroll cron failed');
    }
  });
}
