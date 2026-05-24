import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, AllianceType } from '@bloxive/shared';
import { proposeAlliance, acceptAlliance, terminateAlliance, getAlliances } from '../systems/diplomacy.js';

export const allianceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('alliance')
    .setDescription('Diplomacy and alliances')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => 
      sub.setName('propose')
        .setDescription('Propose an alliance to another nation')
        .addStringOption(opt => opt.setName('target_guild_id').setDescription('Target Server ID').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('Alliance Type').setRequired(true)
          .addChoices(
            { name: 'Recognition', value: 'recognition' },
            { name: 'Free Transit', value: 'free_transit' },
            { name: 'Trade', value: 'trade' }
          ))
    )
    .addSubcommand(sub =>
      sub.setName('accept')
        .setDescription('Accept an alliance proposal')
        .addStringOption(opt => opt.setName('alliance_id').setDescription('Alliance ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List your active alliances')
    )
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) return;
    
    if (!nation.config.features.diplomacy_enabled) {
      await interaction.reply({ content: t('alliance.disabled', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'propose') {
      const targetGuildId = interaction.options.getString('target_guild_id', true);
      const type = interaction.options.getString('type', true) as AllianceType;
      
      const targetNation = await nationCol.findOne({ guild_id: targetGuildId });
      if (!targetNation) {
        await interaction.reply({ content: t('alliance.target_not_found', locale), flags: MessageFlags.Ephemeral });
        return;
      }
      
      const proposal = await proposeAlliance({
        initiatorGuildId: guildId,
        partnerGuildId: targetGuildId,
        type,
        effects: {
          share_sanctions: type === 'recognition' || type === 'free_transit',
          auto_fastpass: type === 'free_transit',
          auto_fastpass_role: null,
          trade_terms: null
        }
      });
      
      await interaction.reply({ content: t('alliance.proposed', locale, { target: targetNation.name, id: proposal._id.toString() }) });
      
    } else if (subcommand === 'accept') {
      const allianceId = interaction.options.getString('alliance_id', true);
      
      try {
        await acceptAlliance(allianceId, guildId);
        await interaction.reply({ content: t('alliance.accepted', locale) });
      } catch (err: any) {
        await interaction.reply({ content: err.message, flags: MessageFlags.Ephemeral });
      }
    } else if (subcommand === 'list') {
      const alliances = await getAlliances(guildId);
      
      let content = `# 🤝 ${t('alliance.active_title', locale)}\n\n`;
      if (alliances.length === 0) content += t('alliance.none', locale);
      
      for (const a of alliances) {
        const partnerId = a.member_guild_ids.find(id => id !== guildId);
        content += `- **Type:** ${a.type} | **Partner ID:** ${partnerId} | **ID:** \`${a._id.toString()}\`\n`;
      }
      
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  },
};
