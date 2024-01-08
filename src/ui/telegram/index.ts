import FastGlob from "fast-glob";
import path from "path";
import { Telegraf } from "telegraf";
import { settings } from "../../core/settings";
const startBot = () => {
  const bot = new Telegraf(settings.BOT_TOKEN);
  return bot;
};

export const bot = startBot();

export type Bot = typeof bot;

FastGlob.sync(path.join(__dirname, 'plugins/*.ts')).forEach(async command => {
  const commandExecutor = (await import(command)).default;
  commandExecutor(bot);
})

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
