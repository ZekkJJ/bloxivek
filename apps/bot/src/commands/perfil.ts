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
    const locale = identity?.preferred_locale ?? 'es';
    
    let robloxText = t('perfil.not_verified', locale);
    if (identity?.roblox_id) {
      robloxText = t('perfil.roblox', locale, { roblox_username: identity.roblox_username ?? 'Unknown' });
    }
    
    const pps = identity?.pps ?? 500;
    
    const content = `
# ${t('perfil.title', locale, { username: interaction.user.username })}

**${t('perfil.global_section', locale)}**
- ${robloxText}
- ${t('perfil.pps', locale, { pps })}

*(La integración local de ciudadanía y economía se agregará en próximas fases)*
`;

    await interaction.reply({
      content,
      flags: MessageFlags.Ephemeral,
    });
  },
};
