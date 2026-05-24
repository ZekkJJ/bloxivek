import { Events, MessageFlags } from 'discord.js';
import { loggers } from '../lib/logger.js';
import type { Event } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, GlobalIdentity } from '@bloxive/shared';
import { getGlobalIdentity } from '../systems/identity.js';
import { getVerificationSession, clearVerificationSession, getRobloxUserByUsername } from '../lib/roblox.js';
import { errorContainer, successContainer, bloxiveContainer } from '../builders/containers.js';

const log = loggers.bot;

export const interactionCreateEvent: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    if (interaction.isButton()) {
      if (interaction.customId === 'verify_roblox_bio') {
        const discordId = interaction.user.id;
        const identity = await getGlobalIdentity(discordId);
        const locale = identity?.preferred_locale ?? 'es';

        const session = getVerificationSession(discordId);
        if (!session) {
          await interaction.reply({
            embeds: [errorContainer(t('common.error', locale))],
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const robloxUser = await getRobloxUserByUsername(session.robloxUsername);
        if (!robloxUser) {
          await interaction.followUp({
            embeds: [errorContainer(t('common.target_not_found', locale, { target: session.robloxUsername }))],
          });
          return;
        }

        if (robloxUser.description && robloxUser.description.trim().includes(session.code)) {
          // Success
          const { linkRobloxAccount } = await import('../systems/identity.js');
          await linkRobloxAccount(discordId, robloxUser.id.toString(), robloxUser.name, null);
          
          clearVerificationSession(discordId);
          
          await interaction.followUp({
            embeds: [successContainer(t('vincular.success', locale, { username: robloxUser.name }))],
          });
        } else {
          // Failure
          const errorMsg = (locale === 'es') 
            ? "Código no encontrado. **Importante:** Roblox cachea los perfiles por hasta 5 minutos. Si acabas de guardar, espera unos minutos y vuelve a intentarlo."
            : "Code not found. **Important:** Roblox caches profiles for up to 5 minutes. If you just saved, please wait a few minutes and try again.";
          
          await interaction.followUp({
            embeds: [errorContainer(errorMsg)],
          });
        }
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'setup_modal_step1') {
        const { handleSetupModal1 } = await import('./setupWizard.js');
        await handleSetupModal1(interaction);
        return;
      }
    }
    
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'setup_select_roblox') {
        const { handleSetupSelectRoblox } = await import('./setupWizard.js');
        await handleSetupSelectRoblox(interaction);
        return;
      }
      if (interaction.customId === 'setup_select_border') {
        const { handleSetupSelectBorder } = await import('./setupWizard.js');
        await handleSetupSelectBorder(interaction);
        return;
      }
    }
    
    if (interaction.isButton()) {
      if (interaction.customId === 'setup_btn_arcade') {
        const { handleSetupFinalize } = await import('./setupWizard.js');
        await handleSetupFinalize(interaction, 'arcade');
        return;
      }
      if (interaction.customId === 'setup_btn_realistic') {
        const { handleSetupFinalize } = await import('./setupWizard.js');
        await handleSetupFinalize(interaction, 'realistic');
        return;
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      log.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      log.error({ err: error, command: interaction.commandName }, 'Error executing command');
      
      const errorMessage = {
        content: t('common.error', 'es'),
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
  },
};
