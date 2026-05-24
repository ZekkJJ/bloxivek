import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { arrestCitizen } from '../systems/law.js';

export const arrestCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('arrest')
    .setDescription('Arrest a citizen')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Citizen to arrest')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for arrest')
        .setRequired(true))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
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
    
    try {
      const lawCase = await arrestCitizen(guildId, targetUser.id, officerId, reason, nation);
      
      let replyContent = t('arrest.success', locale, { username: targetUser.username, case_number: lawCase.case_number });
      
      if (nation.config.law.arrest_bonus_amount > 0) {
        replyContent += `\n${t('arrest.bonus', locale, { symbol: nation.currency_symbol, amount: nation.config.law.arrest_bonus_amount })}`;
      }
      
      await interaction.reply({ content: replyContent });
    } catch (err: any) {
      let msg = t('common.error', locale);
      if (err.message === 'Not a citizen') msg = t('common.target_not_citizen', locale, { username: targetUser.username });
      if (err.message === 'Already arrested') msg = t('arrest.already_arrested', locale, { username: targetUser.username, case_number: 'UNKNOWN' });
      
      await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
    }
  },
};
