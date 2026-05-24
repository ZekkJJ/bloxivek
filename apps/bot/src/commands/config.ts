import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, EconomyMode, BorderMode } from '@bloxive/shared';

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Update nation configuration')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('economy_mode')
        .setDescription('Change the economy mode')
        .addStringOption(option =>
          option.setName('mode')
            .setDescription('Mode: arcade or realistic')
            .setRequired(true)
            .addChoices(
              { name: 'Arcade', value: 'arcade' },
              { name: 'Realistic', value: 'realistic' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('border_mode')
        .setDescription('Change the border mode')
        .addStringOption(option =>
          option.setName('mode')
            .setDescription('Border mode')
            .setRequired(true)
            .addChoices(
              { name: 'Open', value: 'open' },
              { name: 'Tier Gated', value: 'tier_gated' },
              { name: 'Application', value: 'application' },
              { name: 'Closed', value: 'closed' }
            )
        )
    )
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    if (!interaction.inGuild()) return;
    
    const guildId = interaction.guildId!;
    const collection = getCollection<Nation>(Collections.NATIONS);
    
    const nation = await collection.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) {
      await interaction.reply({ content: t('common.not_setup', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'economy_mode') {
      const mode = interaction.options.getString('mode', true) as EconomyMode;
      await collection.updateOne({ guild_id: guildId }, { $set: { 'config.mode': mode, updated_at: new Date() } });
      await interaction.reply({ content: t('config.updated', locale, { section: 'economy', key: 'mode', value: mode }) });
    } 
    else if (subcommand === 'border_mode') {
      const mode = interaction.options.getString('mode', true) as BorderMode;
      await collection.updateOne({ guild_id: guildId }, { $set: { 'config.border.mode': mode, updated_at: new Date() } });
      await interaction.reply({ content: t('config.updated', locale, { section: 'border', key: 'mode', value: mode }) });
    }
  },
};
