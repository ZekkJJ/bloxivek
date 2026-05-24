import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getGlobalIdentity } from '../systems/identity.js';

export const perfilCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View global identity profile')
    .setIntegrationTypes([0, 1]),
    
  async execute(interaction) {
    const identity = await getGlobalIdentity(interaction.user.id);
    const guildId = interaction.guildId;
    let locale: 'es' | 'en' = identity?.preferred_locale ?? 'es';
    let citizen: any = undefined;
    let nation: any = undefined;

    if (guildId) {
      const { getCollection, Collections } = await import('../lib/db.js');
      const nationCol = getCollection(Collections.NATIONS);
      nation = await nationCol.findOne({ guild_id: guildId });
      if (nation?.locale) {
        locale = nation.locale;
      }
      
      const { getCitizen } = await import('../systems/economy.js');
      citizen = await getCitizen(guildId, interaction.user.id);
    }

    const { buildProfileCard } = await import('../builders/profileCard.js');
    const embed = buildProfileCard(
      identity as any, 
      locale, 
      interaction.user.username, 
      interaction.user.displayAvatarURL(), 
      citizen, 
      nation
    );

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
