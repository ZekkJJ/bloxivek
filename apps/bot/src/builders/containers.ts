import { EmbedBuilder } from 'discord.js';

export function bloxiveContainer(content: string | any[]) {
  let description = '';
  if (typeof content === 'string') {
    description = content;
  } else if (Array.isArray(content)) {
    description = content.map(c => c.text || '').join('\n');
  }

  return new EmbedBuilder()
    .setColor(0x6C47FF)
    .setDescription(description || ' ');
}

export function errorContainer(message: string) {
  return new EmbedBuilder()
    .setColor(0xFF0000)
    .setDescription(`❌ ${message}`);
}

export function successContainer(message: string) {
  return new EmbedBuilder()
    .setColor(0x00FF00)
    .setDescription(`✅ ${message}`);
}
