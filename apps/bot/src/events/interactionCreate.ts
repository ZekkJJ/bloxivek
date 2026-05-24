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

        if (robloxUser.description && robloxUser.description.includes(session.code)) {
          // Success
          const { linkRobloxAccount } = await import('../systems/identity.js');
          await linkRobloxAccount(discordId, robloxUser.id.toString(), robloxUser.name, null);
          
          clearVerificationSession(discordId);
          
          await interaction.followUp({
            embeds: [successContainer(t('vincular.success', locale, { username: robloxUser.name }))],
          });
        } else {
          // Failure
          await interaction.followUp({
            embeds: [errorContainer(t('common.error', locale) + ': Code not found in description.')],
          });
        }
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'setup_modal_step1') {
        const guildId = interaction.guildId!;
        const name = interaction.fields.getTextInputValue('nation_name');
        const currencyName = interaction.fields.getTextInputValue('currency_name');
        const currencySymbol = interaction.fields.getTextInputValue('currency_symbol');

        const identity = await getGlobalIdentity(interaction.user.id);
        const locale = identity?.preferred_locale ?? 'es';

        const collection = getCollection<Nation>(Collections.NATIONS);
        const now = new Date();
        const nation: Omit<Nation, '_id'> = {
          guild_id: guildId,
          name,
          currency_name: currencyName,
          currency_symbol: currencySymbol,
          flag_url: null,
          description: 'A new nation',
          locale: locale,
          prestige_tier: 'unranked',
          prestige_score: 0,
          owner_discord_id: interaction.guild?.ownerId ?? interaction.user.id,
          config: {
            mode: 'arcade',
            economy: {
              wallet_bank_split: false,
              bank_withdraw_fee_pct: 0,
              interest_rate_daily_pct: 0,
              max_wallet_balance: null,
              transaction_tax_pct: 0,
              company_creation_mode: 'open',
              company_creation_fee: 0,
              max_employees_per_company: 10,
              can_citizens_create_jobs: true,
            },
            border: {
              mode: 'open',
              min_pps_entry: null,
              auto_fastpass_pps_threshold: null,
              auto_fastpass_alliance: true,
            },
            law: {
              leo_roles: [],
              leo_permissions: {},
              max_fine_without_approval: 1000,
              max_fines_per_hour_per_officer: 10,
              fine_distribution: { treasury_pct: 100, officer_pct: 0, department_fund_pct: 0 },
              arrest_bonus_amount: 0,
              bail_enabled: false,
              bail_multiplier: 1,
              unpaid_fine_block_threshold: null,
              immune_roles: [],
            },
            treasury: {
              payroll_enabled: false,
              payroll_interval_hours: 24,
              runway_alert_days: 7,
            },
            channels: {
              general: null,
              law_log: null,
              immigration_log: null,
              alliance_log: null,
              economy_log: null,
              government_alerts: null,
            },
            features: {
              companies_enabled: true,
              diplomacy_enabled: true,
              interpol_enabled: false,
              dni_editor_unlocked: false,
              analytics_enabled: false,
            }
          },
          created_at: now,
          updated_at: now,
        };
        
        await collection.insertOne(nation as any);
        
        const embed = bloxiveContainer(t('setup.confirmed', locale, { nation_name: name, currency_symbol: currencySymbol, currency_name: currencyName }))
          .setTitle('Nación Creada Exitosamente');
        
        await interaction.reply({
          embeds: [embed],
        });
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
