import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { issueFine } from '../systems/law.js';

export const fineCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('fine')
    .setDescription('Issue a fine to a citizen')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Citizen to fine')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Fine amount')
        .setRequired(true)
        .setMinValue(1))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the fine')
        .setRequired(true))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    const reason = interaction.options.getString('reason', true);
    const guildId = interaction.guildId!;
    const officerId = interaction.user.id;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) {
      await interaction.reply({ content: t('common.not_setup', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    // Check permissions (stub: normally check config.law.leo_permissions against user roles)
    // For now, allow all (assuming permission checked at Discord level)
    
    try {
      const lawCase = await issueFine(guildId, targetUser.id, officerId, amount, reason, nation);
      
      let replyContent = t('fine.success', locale, { case_number: lawCase.case_number });
      
      if (lawCase.status === 'paid') {
        replyContent += `\n${t('fine.paid', locale, { symbol: nation.currency_symbol, amount, case_number: lawCase.case_number })}`;
        if (lawCase.distribution_executed) {
          replyContent += `\n${t('fine.distribution', locale, {
            symbol: nation.currency_symbol,
            treasury: lawCase.distribution_executed.treasury,
            officer: lawCase.distribution_executed.officer,
            department: lawCase.distribution_executed.department_fund
          })}`;
        }
      } else {
        replyContent += `\n${t('fine.as_debt', locale, { username: targetUser.username })}`;
      }
      
      await interaction.reply({ content: replyContent });
    } catch (err: any) {
      const msg = err.message === 'Not a citizen' 
        ? t('common.target_not_citizen', locale, { username: targetUser.username }) 
        : t('common.error', locale);
      await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
    }
  },
};
