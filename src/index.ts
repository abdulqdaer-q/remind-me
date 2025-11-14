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

// Application
import { RegisterUserUseCase } from './application/user/RegisterUserUseCase';
import { UpdateUserLocationUseCase } from './application/user/UpdateUserLocationUseCase';
import { SubscribeUserUseCase } from './application/user/SubscribeUserUseCase';
import { GetPrayerTimesUseCase } from './application/prayer/GetPrayerTimesUseCase';

// Presentation
import { TimingsHandler } from './presentation/telegram/handlers/TimingsHandler';
import { SubscribeHandler } from './presentation/telegram/handlers/SubscribeHandler';
import { LocationHandler } from './presentation/telegram/handlers/LocationHandler';
import { PrayerTimesFormatter } from './presentation/telegram/formatters/PrayerTimesFormatter';

// Dependency Injection Container
class Container {
  // Infrastructure
  private readonly userRepository = new JsonUserRepository();
  private readonly prayerTimesService = new AladhanPrayerTimesService();
  private readonly translationService = new TranslationService();

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
    this.prayerTimesFormatter
  );

  private readonly subscribeHandler = new SubscribeHandler(
    this.registerUserUseCase,
    this.translationService
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
      this.timingsHandler,
      this.subscribeHandler,
      this.locationHandler
    );
  }
}

// Bootstrap
const container = new Container();
const bot = container.getTelegramBot();
bot.launch();
