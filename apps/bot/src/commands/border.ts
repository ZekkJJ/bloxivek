import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, BorderMode } from '@bloxive/shared';

export const borderCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('border')
    .setDescription('Border control dashboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => 
      sub.setName('status')
        .setDescription('Check current border status')
    )
    .addSubcommand(sub =>
      sub.setName('set_mode')
        .setDescription('Set border mode')
        .addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true)
          .addChoices(
            { name: 'Open', value: 'open' },
            { name: 'Tier Gated', value: 'tier_gated' },
            { name: 'Application', value: 'application' },
            { name: 'Closed', value: 'closed' }
          ))
    )
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) return;
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'status') {
      let content = `# ${t('border.status_title', locale)}\n`;
      content += t('border.mode', locale, { mode: nation.config.border.mode });
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    } else if (subcommand === 'set_mode') {
      const mode = interaction.options.getString('mode', true) as BorderMode;
      await nationCol.updateOne({ guild_id: guildId }, { $set: { 'config.border.mode': mode } });
      await interaction.reply({ content: t('config.updated', locale, { section: 'border', key: 'mode', value: mode }) });
    }
  },
};
