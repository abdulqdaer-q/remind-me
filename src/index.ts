/**
 * Main Application Entry Point
 * Sets up dependency injection and launches the bot
 */

import 'reflect-metadata';

// Core DI
import { Container } from './core/di/Container';
import { TOKENS } from './core/di/tokens';

// Infrastructure
import { settings } from './infrastructure/config/Settings';
import { JsonUserRepository } from './infrastructure/persistence/JsonUserRepository';
import { GrpcPrayerTimesService } from './infrastructure/api/GrpcPrayerTimesService';
import { GrpcTranslationService } from './infrastructure/i18n/GrpcTranslationService';
import { TelegramBot } from './infrastructure/telegram/TelegramBot';
import { SessionManager } from './infrastructure/telegram/Session';

// Application
import { RegisterUserUseCase } from './application/user/RegisterUserUseCase';
import { UpdateUserLocationUseCase } from './application/user/UpdateUserLocationUseCase';
import { SubscribeUserUseCase } from './application/user/SubscribeUserUseCase';
import { GetPrayerTimesUseCase } from './application/prayer/GetPrayerTimesUseCase';

// Presentation
import { PrayerTimesFormatter } from './presentation/telegram/formatters/PrayerTimesFormatter';

// Reminder System
import { NotificationService } from './infrastructure/telegram/NotificationService';
import { ReminderScheduler } from './application/reminder/ReminderScheduler';
import { VoiceChatService } from './infrastructure/telegram/VoiceChatService';

// Import handlers to ensure decorators are executed
import './presentation/telegram/handlers/TimingsHandler';
import './presentation/telegram/handlers/SubscribeHandler';
import './presentation/telegram/handlers/LocationHandler';
import './presentation/telegram/handlers/StartHandler';

/**
 * Setup Dependency Injection Container
 */
function setupContainer(): Container {
  const container = new Container();

  // Register Infrastructure Services
  container.register(
    TOKENS.UserRepository,
    () => new JsonUserRepository(),
    'singleton'
  );

  container.register(
    TOKENS.PrayerTimesService,
    () => new GrpcPrayerTimesService(),
    'singleton'
  );

  container.register(
    TOKENS.TranslationService,
    () => new GrpcTranslationService(),
    'singleton'
  );

  container.register(
    TOKENS.SessionManager,
    () => new SessionManager(),
    'singleton'
  );

  // Register Configuration
  container.register(
    TOKENS.WebAppUrl,
    () => settings.WEB_APP_URL,
    'singleton'
  );

  container.register(
    TOKENS.Settings,
    () => settings,
    'singleton'
  );

  // Register Use Cases
  container.register(
    TOKENS.RegisterUserUseCase,
    (c) => new RegisterUserUseCase(c.resolve(TOKENS.UserRepository)),
    'singleton'
  );

  container.register(
    TOKENS.UpdateUserLocationUseCase,
    (c) => new UpdateUserLocationUseCase(c.resolve(TOKENS.UserRepository)),
    'singleton'
  );

  container.register(
    TOKENS.SubscribeUserUseCase,
    (c) => new SubscribeUserUseCase(c.resolve(TOKENS.UserRepository)),
    'singleton'
  );

  container.register(
    TOKENS.GetPrayerTimesUseCase,
    (c) => new GetPrayerTimesUseCase(c.resolve(TOKENS.PrayerTimesService)),
    'singleton'
  );

  // Register Formatters
  container.register(
    TOKENS.PrayerTimesFormatter,
    (c) => new PrayerTimesFormatter(c.resolve(TOKENS.TranslationService)),
    'singleton'
  );

  return container;
}

/**
 * Bootstrap the application
 */
function bootstrap(): void {
  console.log('> Bilal bot is starting...');
  console.log('> Setting up dependency injection...');

  const container = setupContainer();

  console.log('> Creating Telegram bot...');
  const bot = new TelegramBot(
    settings.BOT_TOKEN,
    container.resolve(TOKENS.SessionManager),
    container
  );

  // Register reminder services after bot is created
  console.log('> Setting up reminder system...');

  // Register VoiceChatService (optional - only if configured)
  const voiceChatService = new VoiceChatService(
    settings.API_ID,
    settings.API_HASH,
    settings.SESSION_STRING
  );

  container.register(TOKENS.VoiceChatService, () => voiceChatService, 'singleton');

  // Initialize voice chat service if configured
  if (settings.API_ID && settings.API_HASH) {
    console.log('> Initializing voice chat service...');
    voiceChatService.initialize().catch((error) => {
      console.error('Failed to initialize voice chat service:', error);
    });
  }

  container.register(
    TOKENS.NotificationService,
    () => new NotificationService(bot.getBot(), voiceChatService),
    'singleton'
  );

  container.register(
    TOKENS.ReminderScheduler,
    (c) =>
      new ReminderScheduler(
        c.resolve(TOKENS.UserRepository),
        c.resolve(TOKENS.PrayerTimesService),
        c.resolve(TOKENS.TranslationService),
        c.resolve(TOKENS.NotificationService)
      ),
    'singleton'
  );

  console.log('> Launching bot...');
  bot.launch();

  // Start the reminder scheduler
  console.log('> Starting reminder scheduler...');
  const scheduler = container.resolve(TOKENS.ReminderScheduler) as ReminderScheduler;
  scheduler.start();

  // Graceful shutdown for scheduler and voice chat
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    scheduler.stop();

    // Disconnect voice chat service if it's running
    if (voiceChatService.isAvailable()) {
      console.log('> Disconnecting voice chat service...');
      await voiceChatService.disconnect();
    }

    process.exit(0);
  };

  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

// Start the application
bootstrap();
