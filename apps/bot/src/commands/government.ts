import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { processGuildPayroll } from '../systems/payroll.js';
import { getTreasuryBalance } from '../systems/treasury.js';

export const governmentCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('government')
    .setDescription('Government administration dashboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => 
      sub.setName('treasury')
        .setDescription('View treasury balance')
    )
    .addSubcommand(sub =>
      sub.setName('force_payroll')
        .setDescription('Force execute payroll immediately')
    )
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) return;
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'treasury') {
      const balance = await getTreasuryBalance(guildId);
      await interaction.reply({ 
        content: `# 🏦 ${t('government.treasury', locale)}\n**${balance}** ${nation.currency_symbol}`, 
        flags: MessageFlags.Ephemeral 
      });
    } else if (subcommand === 'force_payroll') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await processGuildPayroll(guildId);
      
      let content = t('government.payroll_executed', locale);
      content += `\nPaid: ${result.totalPaid} ${nation.currency_symbol} to ${result.employeesPaid} citizens.`;
      
      if (result.shortfall > 0) {
        content += `\n⚠️ **Shortfall:** ${result.shortfall} ${nation.currency_symbol}`;
      }
      
      await interaction.editReply({ content });
    }
  },
};
