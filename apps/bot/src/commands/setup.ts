import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { getGlobalIdentity } from '../systems/identity.js';

export const setupCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure your nation')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
  async execute(interaction) {
    const identity = await getGlobalIdentity(interaction.user.id);
    const locale = identity?.preferred_locale ?? 'es';

    if (!interaction.inGuild()) {
      await interaction.reply({ content: t('common.error', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const guildId = interaction.guildId!;
    const collection = getCollection<Nation>(Collections.NATIONS);
    
    const existing = await collection.findOne({ guild_id: guildId });
    if (existing) {
      await interaction.reply({
        content: t('setup.already_exists', existing.locale, { nation_name: existing.name }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    
    // Interactive Modal
    const modal = new ModalBuilder()
      .setCustomId('setup_modal_step1')
      .setTitle('Bloxive V3 - Setup');

    const nameInput = new TextInputBuilder()
      .setCustomId('nation_name')
      .setLabel('Nombre de la Nación')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const currencyNameInput = new TextInputBuilder()
      .setCustomId('currency_name')
      .setLabel('Nombre de la Moneda')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const currencySymbolInput = new TextInputBuilder()
      .setCustomId('currency_symbol')
      .setLabel('Símbolo de la Moneda')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(currencyNameInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(currencySymbolInput);

    modal.addComponents(row1, row2, row3);

    await interaction.showModal(modal);
  },
};
