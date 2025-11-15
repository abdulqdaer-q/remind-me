/**
 * Service tokens for dependency injection
 * Using symbols to ensure type safety and avoid naming collisions
 */

// Infrastructure Services
export const TOKENS = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),

  // External Services
  PrayerTimesService: Symbol.for('PrayerTimesService'),
  TranslationService: Symbol.for('TranslationService'),

  // Telegram Infrastructure
  SessionManager: Symbol.for('SessionManager'),
  TelegramBot: Symbol.for('TelegramBot'),

  // Use Cases
  RegisterUserUseCase: Symbol.for('RegisterUserUseCase'),
  UpdateUserLocationUseCase: Symbol.for('UpdateUserLocationUseCase'),
  SubscribeUserUseCase: Symbol.for('SubscribeUserUseCase'),
  GetPrayerTimesUseCase: Symbol.for('GetPrayerTimesUseCase'),

  // Formatters
  PrayerTimesFormatter: Symbol.for('PrayerTimesFormatter'),

  // Reminder System
  NotificationService: Symbol.for('NotificationService'),
  ReminderScheduler: Symbol.for('ReminderScheduler'),

  // Configuration
  WebAppUrl: Symbol.for('WebAppUrl'),
  Settings: Symbol.for('Settings'),
} as const;

// Type-safe token accessor
export type TokenType = typeof TOKENS;
export type TokenKey = keyof TokenType;
