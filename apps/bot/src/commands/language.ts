import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { t } from '../i18n/index.js';

export const languageCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('Change the response language of the bot in this nation.')
    .addStringOption(option => 
      option.setName('locale')
        .setDescription('The language to use')
        .setRequired(true)
        .addChoices(
          { name: 'Español', value: 'es' },
          { name: 'English', value: 'en' }
        )
    )
    .setDefaultMemberPermissions(0) // Admin only
    .setIntegrationTypes([0]), // Guild only
    
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const newLocale = interaction.options.getString('locale') as 'es' | 'en';
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    
    if (!nation) {
      await interaction.reply({ content: t('common.not_setup', 'en'), flags: MessageFlags.Ephemeral });
      return;
    }
    
    await nationCol.updateOne(
      { guild_id: guildId },
      { $set: { locale: newLocale, updated_at: new Date() } }
    );
    
    await interaction.reply({ 
      content: `✅ Language updated to **${newLocale === 'es' ? 'Español' : 'English'}**.`,
      flags: MessageFlags.Ephemeral 
    });
  },
};
