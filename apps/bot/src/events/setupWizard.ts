import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder } from 'discord.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { t } from '../i18n/index.js';
import { getGlobalIdentity } from '../systems/identity.js';

interface SetupState {
  name: string;
  currencyName: string;
  currencySymbol: string;
  robloxReq: 'required' | 'optional' | 'none';
  borderMode: 'open' | 'tier_gated' | 'application' | 'closed';
}

const setupStates = new Map<string, Partial<SetupState>>();

export async function handleSetupModal1(interaction: any) {
  const guildId = interaction.guildId!;
  const name = interaction.fields.getTextInputValue('nation_name');
  const currencyName = interaction.fields.getTextInputValue('currency_name');
  const currencySymbol = interaction.fields.getTextInputValue('currency_symbol');

  setupStates.set(guildId, { name, currencyName, currencySymbol });

  const select = new StringSelectMenuBuilder()
    .setCustomId('setup_select_roblox')
    .setPlaceholder('¿Requieres verificación de Roblox?')
    .addOptions(
      { label: 'Sí, obligatoria', value: 'required', description: 'Todos deben vincular Roblox para registrarse.' },
      { label: 'No, opcional', value: 'optional', description: 'Pueden jugar sin vincular.' },
      { label: 'No usar Roblox', value: 'none', description: 'Deshabilitar por completo.' }
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: '**Paso 3: Verificación Roblox**\nSelecciona el nivel de verificación requerido:',
    components: [row],
    flags: MessageFlags.Ephemeral
  });
}

export async function handleSetupSelectRoblox(interaction: any) {
  const guildId = interaction.guildId!;
  const state = setupStates.get(guildId) || {};
  state.robloxReq = interaction.values[0] as any;
  setupStates.set(guildId, state);

  const select = new StringSelectMenuBuilder()
    .setCustomId('setup_select_border')
    .setPlaceholder('Modo de Frontera')
    .addOptions(
      { label: 'Abierta', value: 'open', description: 'Cualquiera puede unirse con /registro.' },
      { label: 'Tier Gated', value: 'tier_gated', description: 'Requiere PPS mínimo.' },
      { label: 'Por Aplicación', value: 'application', description: 'Requiere aprobación de admin.' },
      { label: 'Cerrada', value: 'closed', description: 'Nadie puede entrar.' }
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.update({
    content: '**Paso 4: Modo de Frontera**\n¿Cómo se gestionan las entradas a tu nación?',
    components: [row]
  });
}

export async function handleSetupSelectBorder(interaction: any) {
  const guildId = interaction.guildId!;
  const state = setupStates.get(guildId) || {};
  state.borderMode = interaction.values[0] as any;
  setupStates.set(guildId, state);

  const btnArcade = new ButtonBuilder()
    .setCustomId('setup_btn_arcade')
    .setLabel('🎮 Modo Arcade')
    .setStyle(ButtonStyle.Primary);

  const btnRealistic = new ButtonBuilder()
    .setCustomId('setup_btn_realistic')
    .setLabel('🏛️ Modo Realista')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btnArcade, btnRealistic);

  await interaction.update({
    content: '**Paso 5: Modo General**\nElige el estilo de simulación para tu nación. Esto preconfigurará más de 30 variables (podrás cambiarlas luego).',
    components: [row]
  });
}

export async function handleSetupFinalize(interaction: any, mode: 'arcade' | 'realistic') {
  const guildId = interaction.guildId!;
  const state = setupStates.get(guildId);
  
  if (!state || !state.name || !state.currencyName || !state.currencySymbol || !state.robloxReq || !state.borderMode) {
    await interaction.update({ content: '❌ El estado del setup se perdió. Vuelve a ejecutar /setup.', components: [] });
    return;
  }

  const identity = await getGlobalIdentity(interaction.user.id);
  const locale = identity?.preferred_locale ?? 'es';

  const collection = getCollection<Nation>(Collections.NATIONS);
  const now = new Date();
  
  const nation: Omit<Nation, '_id'> = {
    guild_id: guildId,
    name: state.name,
    currency_name: state.currencyName,
    currency_symbol: state.currencySymbol,
    flag_url: null,
    description: 'A new Bloxive nation',
    locale: locale,
    prestige_tier: 'unranked',
    prestige_score: 0,
    owner_discord_id: interaction.guild?.ownerId ?? interaction.user.id,
    config: {
      mode,
      economy: {
        wallet_bank_split: mode === 'realistic',
        bank_withdraw_fee_pct: mode === 'realistic' ? 2 : 0,
        interest_rate_daily_pct: mode === 'realistic' ? 0.5 : 0,
        max_wallet_balance: null,
        transaction_tax_pct: mode === 'realistic' ? 5 : 0,
        company_creation_mode: mode === 'realistic' ? 'bureaucratic' : 'open',
        company_creation_fee: mode === 'realistic' ? 5000 : 0,
        max_employees_per_company: mode === 'realistic' ? 50 : 10,
        can_citizens_create_jobs: mode === 'arcade',
      },
      border: {
        mode: state.borderMode,
        min_pps_entry: state.borderMode === 'tier_gated' ? 500 : null,
        auto_fastpass_pps_threshold: state.borderMode === 'tier_gated' ? 800 : null,
        auto_fastpass_alliance: true,
      },
      law: {
        leo_roles: [],
        leo_permissions: {},
        max_fine_without_approval: mode === 'realistic' ? 5000 : 50000,
        max_fines_per_hour_per_officer: mode === 'realistic' ? 5 : 20,
        fine_distribution: { treasury_pct: 70, officer_pct: 10, department_fund_pct: 20 },
        arrest_bonus_amount: mode === 'realistic' ? 500 : 1000,
        bail_enabled: mode === 'realistic',
        bail_multiplier: mode === 'realistic' ? 2.5 : 1.5,
        unpaid_fine_block_threshold: mode === 'realistic' ? 10000 : null,
        immune_roles: [],
      },
      treasury: {
        payroll_enabled: mode === 'realistic',
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
  setupStates.delete(guildId);
  
  const embed = new EmbedBuilder()
    .setColor(0x6C47FF)
    .setTitle(t('setup.welcome', locale, { nation_name: state.name }))
    .setDescription(t('setup.confirmed', locale, { nation_name: state.name, currency_symbol: state.currencySymbol, currency_name: state.currencyName }));
  
  await interaction.update({
    content: '',
    embeds: [embed],
    components: []
  });
}
