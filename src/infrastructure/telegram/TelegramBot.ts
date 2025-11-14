import { Telegraf } from 'telegraf';
import { SessionManager, BotContext } from './Session';
import { TimingsHandler } from '../../presentation/telegram/handlers/TimingsHandler';
import { SubscribeHandler } from '../../presentation/telegram/handlers/SubscribeHandler';
import { LocationHandler } from '../../presentation/telegram/handlers/LocationHandler';
import { StartHandler } from '../../presentation/telegram/handlers/StartHandler';
import { JsonUserRepository } from '../persistence/JsonUserRepository';
import { RegisterUserUseCase } from '../../application/user/RegisterUserUseCase';

/**
 * Telegram Bot Infrastructure
 * Initializes and configures the Telegram bot with handlers
 */
export class TelegramBot {
  private bot: Telegraf<BotContext>;
  private userRepository: JsonUserRepository;
  private registerUserUseCase: RegisterUserUseCase;

  constructor(
    botToken: string,
    private readonly sessionManager: SessionManager,
    private readonly timingsHandler: TimingsHandler,
    private readonly subscribeHandler: SubscribeHandler,
    private readonly startHandler: StartHandler,
    private readonly locationHandler: LocationHandler
  ) {
    this.bot = new Telegraf<BotContext>(botToken);
    this.userRepository = new JsonUserRepository();
    this.registerUserUseCase = new RegisterUserUseCase(this.userRepository);
    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware(): void {
    // Session middleware must be first
    this.bot.use(this.sessionManager.createMiddleware());
  }

  private setupHandlers(): void {
    // Command handlers
    this.bot.command('start', (ctx) => this.startHandler.handleStart(ctx));
    this.bot.command('timings', (ctx) => this.timingsHandler.handle(ctx));
    this.bot.command('subscribe', (ctx) => this.subscribeHandler.handle(ctx));

    // Callback query handlers (for inline buttons)
    this.bot.action(/^lang_(.+)$/, (ctx) =>
      this.startHandler.handleLanguageSelection(ctx)
    );
    this.bot.action(/^func_(.+)$/, async (ctx) => {
      // Need to get user first
      const userId = ctx.from?.id;
      if (!userId) return;

      const user = await this.registerUserUseCase.execute({
        userId,
        username: ctx.from?.username || null,
        displayName: ctx.from?.first_name || 'User',
      });

      if (user) {
        await this.startHandler.handleFunctionalitySelection(ctx, user);
      }
    });

    // Event handlers
    this.bot.on('location', async (ctx) => {
      // Check if this is part of onboarding flow
      if (ctx.session?.conversationState === 'AWAITING_LOCATION') {
        const userId = ctx.from?.id;
        if (!userId) return;

        const user = await this.registerUserUseCase.execute({
          userId,
          username: ctx.from?.username || null,
          displayName: ctx.from?.first_name || 'User',
        });

        if (user) {
          await this.startHandler.handleLocationDuringOnboarding(ctx, user);
        }
      } else {
        // Regular location handler (for /subscribe command)
        await this.locationHandler.handle(ctx);
      }
    });

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
}
