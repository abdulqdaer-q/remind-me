import { Telegraf } from 'telegraf';
import { TimingsHandler } from '../../presentation/telegram/handlers/TimingsHandler';
import { SubscribeHandler } from '../../presentation/telegram/handlers/SubscribeHandler';
import { LocationHandler } from '../../presentation/telegram/handlers/LocationHandler';

/**
 * Telegram Bot Infrastructure
 * Initializes and configures the Telegram bot with handlers
 */
export class TelegramBot {
  private bot: Telegraf;

  constructor(
    botToken: string,
    private readonly timingsHandler: TimingsHandler,
    private readonly subscribeHandler: SubscribeHandler,
    private readonly locationHandler: LocationHandler
  ) {
    this.bot = new Telegraf(botToken);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Command handlers
    this.bot.command('timings', (ctx) => this.timingsHandler.handle(ctx));
    this.bot.command('subscribe', (ctx) => this.subscribeHandler.handle(ctx));

    // Event handlers
    this.bot.on('location', (ctx) => this.locationHandler.handle(ctx));

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx.reply('An error occurred. Please try again later.').catch(console.error);
    });
  }

  launch(): void {
    this.bot.launch();
    console.log('🤖 Bot launched successfully!');

    // Enable graceful stop
    process.once('SIGINT', () => {
      console.log('Stopping bot (SIGINT)...');
      this.bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      console.log('Stopping bot (SIGTERM)...');
      this.bot.stop('SIGTERM');
    });
  }

  stop(reason?: string): void {
    this.bot.stop(reason);
  }
}
