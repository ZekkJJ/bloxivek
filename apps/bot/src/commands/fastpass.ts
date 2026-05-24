import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { issueVisa } from '../systems/visa.js';

export const fastpassCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('fastpass')
    .setDescription('Grant a manual fastpass to a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to grant fastpass')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('duration')
        .setDescription('Duration in days (optional)')
        .setRequired(false))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const duration = interaction.options.getInteger('duration');
    const guildId = interaction.guildId!;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    const { EmbedBuilder } = await import('discord.js');
    await issueVisa(targetUser.id, guildId, guildId, 'fastpass', 'manual', interaction.user.id, duration);
    
    const embed = new EmbedBuilder()
      .setTitle('🎫 Fastpass Otorgado')
      .setDescription(t('fastpass.granted', locale, { username: targetUser.username }))
      .addFields({ name: 'Duración', value: duration ? t('fastpass.duration', locale, { duration: `${duration} days` }) : t('fastpass.permanent', locale) })
      .setColor(0x00FF00);
    
    await interaction.reply({ embeds: [embed] });
  },
};
