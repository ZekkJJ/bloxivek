import type { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  Client,
  ClientEvents
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: Client, ...args: ClientEvents[K]) => Promise<void> | void;
}
