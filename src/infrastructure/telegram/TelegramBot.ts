import { Telegraf } from 'telegraf';
import { SessionManager, BotContext } from './Session';
import { HandlerRegistry } from '../../core/handlers/HandlerRegistry';
import { Container } from '../../core/di/Container';

/**
 * Telegram Bot Infrastructure
 * Initializes and configures the Telegram bot with handlers using DI
 */
export class TelegramBot {
  private bot: Telegraf<BotContext>;
  private handlerRegistry: HandlerRegistry;

  constructor(
    botToken: string,
    private readonly sessionManager: SessionManager,
    private readonly container: Container
  ) {
    this.bot = new Telegraf<BotContext>(botToken);
    this.handlerRegistry = new HandlerRegistry(this.bot, this.container);
    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware(): void {
    // Session middleware must be first
    this.bot.use(this.sessionManager.createMiddleware());
  }

  private setupHandlers(): void {
    // Automatically register all decorated handlers
    this.handlerRegistry.registerAll();

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx
        .reply('An error occurred. Please try again later.')
        .catch(console.error);
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

  /**
   * Get the underlying Telegraf bot instance
   * Useful for services that need direct access to the bot
   */
  getBot(): Telegraf<BotContext> {
    return this.bot;
  }
}
