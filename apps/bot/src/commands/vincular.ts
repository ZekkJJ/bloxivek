import { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getGlobalIdentity } from '../systems/identity.js';
import { generateVerificationCode, getRobloxUserByUsername } from '../lib/roblox.js';
import { errorContainer, bloxiveContainer } from '../builders/containers.js';

export const vincularCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Roblox account with Bloxive')
    .addStringOption(option => 
      option.setName('username')
        .setDescription('Your Roblox Username')
        .setRequired(true))
    .setIntegrationTypes([0, 1]),
    
  async execute(interaction) {
    const discordId = interaction.user.id;
    const identity = await getGlobalIdentity(discordId);
    const locale = identity?.preferred_locale ?? 'es';
    
    if (identity?.roblox_id) {
      await interaction.reply({
        embeds: [errorContainer(t('vincular.already_verified', locale, { 
          username: identity.roblox_username ?? 'Unknown',
          roblox_id: identity.roblox_id
        }))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    
    const robloxUsername = interaction.options.getString('username', true);
    
    // Validate if user exists
    const robloxUser = await getRobloxUserByUsername(robloxUsername);
    if (!robloxUser) {
      await interaction.reply({
        embeds: [errorContainer(t('common.target_not_found', locale, { target: robloxUsername }))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const code = generateVerificationCode(discordId, robloxUsername);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('verify_roblox_bio')
          .setLabel('He puesto el código, verificar')
          .setStyle(ButtonStyle.Success)
      );
      
    const instructions = `Agrega este código en la sección "Acerca de" (About/Description) de tu perfil de Roblox: \n\n**\`${code}\`**\n\nUna vez guardado, haz clic en el botón de abajo.`;
    const embed = bloxiveContainer(instructions).setTitle('🔗 Link Roblox');

    await interaction.reply({
      embeds: [embed],
      components: [row as any],
      flags: MessageFlags.Ephemeral,
    });
  },
};
