import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { releaseCitizen } from '../systems/law.js';

export const releaseCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Release an arrested citizen')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Citizen to release')
        .setRequired(true))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
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
      await releaseCitizen(guildId, targetUser.id, officerId);
      await interaction.reply({ 
        content: t('release.success', locale, { username: targetUser.username, case_number: 'LATEST' }) 
      });
    } catch (err: any) {
      let msg = t('common.error', locale);
      if (err.message === 'No active arrest') msg = t('release.not_arrested', locale, { username: targetUser.username });
      
      await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
    }
  },
};
