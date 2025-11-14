/**
 * Main Application Entry Point
 * Sets up dependency injection and launches the bot
 */

// Infrastructure
import { settings } from './infrastructure/config/Settings';
import { JsonUserRepository } from './infrastructure/persistence/JsonUserRepository';
import { AladhanPrayerTimesService } from './infrastructure/api/AladhanPrayerTimesService';
import { TranslationService } from './infrastructure/i18n/TranslationService';
import { TelegramBot } from './infrastructure/telegram/TelegramBot';
import { SessionManager } from './infrastructure/telegram/Session';

// Application
import { RegisterUserUseCase } from './application/user/RegisterUserUseCase';
import { UpdateUserLocationUseCase } from './application/user/UpdateUserLocationUseCase';
import { SubscribeUserUseCase } from './application/user/SubscribeUserUseCase';
import { GetPrayerTimesUseCase } from './application/prayer/GetPrayerTimesUseCase';

// Presentation
import { TimingsHandler } from './presentation/telegram/handlers/TimingsHandler';
import { SubscribeHandler } from './presentation/telegram/handlers/SubscribeHandler';
import { LocationHandler } from './presentation/telegram/handlers/LocationHandler';
import { StartHandler } from './presentation/telegram/handlers/StartHandler';
import { PrayerTimesFormatter } from './presentation/telegram/formatters/PrayerTimesFormatter';

// Dependency Injection Container
class Container {
  // Infrastructure
  private readonly userRepository = new JsonUserRepository();
  private readonly prayerTimesService = new AladhanPrayerTimesService();
  private readonly translationService = new TranslationService();
  private readonly sessionManager = new SessionManager();

  // Application
  private readonly registerUserUseCase = new RegisterUserUseCase(
    this.userRepository
  );
  private readonly updateUserLocationUseCase = new UpdateUserLocationUseCase(
    this.userRepository
  );
  private readonly subscribeUserUseCase = new SubscribeUserUseCase(
    this.userRepository
  );
  private readonly getPrayerTimesUseCase = new GetPrayerTimesUseCase(
    this.prayerTimesService
  );

  // Presentation
  private readonly prayerTimesFormatter = new PrayerTimesFormatter(
    this.translationService
  );

  private readonly timingsHandler = new TimingsHandler(
    this.getPrayerTimesUseCase,
    this.registerUserUseCase,
    this.prayerTimesFormatter,
    settings.WEB_APP_URL
  );

  private readonly subscribeHandler = new SubscribeHandler(
    this.registerUserUseCase,
    this.translationService
  );

  private readonly startHandler = new StartHandler(
    this.registerUserUseCase,
    this.updateUserLocationUseCase,
    this.translationService,
    this.sessionManager
  );

  private readonly locationHandler = new LocationHandler(
    this.registerUserUseCase,
    this.updateUserLocationUseCase,
    this.subscribeUserUseCase,
    this.translationService
  );

  // Bot
  getTelegramBot(): TelegramBot {
    return new TelegramBot(
      settings.BOT_TOKEN,
      this.sessionManager,
      this.timingsHandler,
      this.subscribeHandler,
      this.startHandler,
      this.locationHandler
    );
  }
}

// Bootstrap
console.log('> Bilal bot is starting...');
const container = new Container();
const bot = container.getTelegramBot();
bot.launch();
