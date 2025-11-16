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
import './presentation/telegram/handlers/TestReminderHandler';

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

  // Register VoiceChatService (connects to Python Pyrogram microservice)
  const voiceChatService = new VoiceChatService(
    settings.VOICE_CHAT_SERVICE_URL
  );

  container.register(TOKENS.VoiceChatService, () => voiceChatService, 'singleton');

  // Initialize voice chat service with retry
  console.log('> Initializing voice chat service...');
  const initializeVoiceChatWithRetry = async (maxRetries = 10, delayMs = 3000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await voiceChatService.initialize();
        console.log('✅ Voice chat service connected!');
        return;
      } catch (error) {
        if (i < maxRetries - 1) {
          console.log(`⏳ Voice chat service not ready, retrying in ${delayMs/1000}s... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          console.warn('⚠️  Voice chat service not available after retries, falling back to voice messages');
        }
      }
    }
  };

  // Start retry in background, don't block bot startup
  initializeVoiceChatWithRetry().catch(() => {
    console.warn('Voice chat service initialization failed');
  });

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

  console.log('> Setting up bot handlers...');
  bot.setupHandlers();

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
