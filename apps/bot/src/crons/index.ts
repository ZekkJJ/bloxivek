import { startPPSCron } from './pps.cron.js';
import { startPrestigeCron } from './prestige.cron.js';
import { startPayrollCron } from './payroll.cron.js';
import { startRunwayCron } from './runway.cron.js';
import { startVisaCron } from './visa.cron.js';
import { startSanctionsCron } from './sanctions.cron.js';

export function startAllCrons() {
  startPPSCron();
  startPrestigeCron();
  startPayrollCron();
  startRunwayCron();
  startVisaCron();
  startSanctionsCron();
}
