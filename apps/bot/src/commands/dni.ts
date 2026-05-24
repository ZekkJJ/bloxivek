import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, Citizen } from '@bloxive/shared';
// import { buildDniCard } from '../builders/dniCard.js'; // Future visual component

export const dniCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('dni')
    .setDescription('View your National ID Card')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to view DNI of')
        .setRequired(false))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const guildId = interaction.guildId!;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) {
      await interaction.reply({ content: t('common.not_setup', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
    const citizen = await citizensCol.findOne({ guild_id: guildId, discord_id: targetUser.id });
    
    if (!citizen) {
      await interaction.reply({ 
        content: t('common.target_not_citizen', locale, { username: targetUser.username }),
        flags: MessageFlags.Ephemeral 
      });
      return;
    }
    
    // In the future, this will generate an image and upload to R2, then return a rich embed/card.
    let content = `# 🪪 DNI: ${nation.name}\n`;
    content += `**Name:** ${targetUser.username}\n`;
    content += `**ID Number:** ${citizen.citizen_number}\n`;
    content += `**Status:** ${citizen.status.toUpperCase()}`;
    
    await interaction.reply({ content });
  },
};
