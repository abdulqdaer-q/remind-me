# CLAUDE.md - AI Assistant Guide for Remind-Me

## Project Overview

**Remind-Me** is a Telegram bot designed to remind users of Islamic prayer times (Salah). The bot helps users stay on track with their daily prayers by providing accurate prayer timings based on their location.

### Key Features
- Prayer time notifications based on user location
- Telegram bot interface with command handlers
- Mini web app for displaying prayer times
- Multi-language support (currently English, with Arabic support structure)
- Location-based prayer time calculation using Aladhan API
- Plugin-based architecture for easy extensibility

---

## Architecture Overview

### Layered Architecture

The project follows a **clean architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────┐
│      UI Layer (Telegram)            │
│  - Bot commands and events          │
│  - User interaction handlers        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Core Layer                     │
│  - Business logic                   │
│  - API services                     │
│  - Models                           │
│  - Utilities                        │
└─────────────────────────────────────┘
```

### Directory Structure

```
remind-me/
├── src/
│   ├── core/                      # Core business logic
│   │   ├── api/
│   │   │   └── prayer-times.ts   # Aladhan API integration
│   │   ├── models/
│   │   │   └── User.ts           # User data model
│   │   ├── utils/
│   │   │   └── date.ts           # Date/time utilities
│   │   └── settings.ts           # Environment configuration
│   │
│   ├── translations/              # i18n support
│   │   ├── index.ts              # Translation loader
│   │   └── en.ts                 # English translations
│   │
│   ├── ui/
│   │   └── telegram/             # Telegram UI layer
│   │       ├── index.ts          # Bot initialization
│   │       ├── plugins/          # Command & event handlers
│   │       │   ├── timings.command.ts
│   │       │   ├── subscribe.command.ts
│   │       │   └── location.event.ts
│   │       └── apps/
│   │           └── salah-times/  # Mini web app (Vite)
│   │
│   ├── db.json                   # Simple JSON database
│   └── index.ts                  # Main entry point
│
├── package.json
├── tsconfig.json
└── .env                          # Environment variables (gitignored)
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Bot Framework**: Telegraf (v4.15.3)
- **HTTP Client**: Axios (v1.6.5)
- **Configuration**: ts-dotenv for environment variables
- **File System**: fast-glob for plugin auto-loading

### Frontend (Mini App)
- **Build Tool**: Vite (v5.0.8)
- **Language**: TypeScript (v5.2.2+)
- **Deployment**: CodePen (development)

### External APIs
- **Aladhan API**: Prayer times calculation (https://api.aladhan.com/v1)

### Development
- **Compiler**: TypeScript 5.3.3
- **Execution**: ts-node for development
- **Type Checking**: Strict mode enabled

---

## Key Components & Patterns

### 1. Plugin System

The bot uses an **auto-loading plugin system** for commands and events:

**Location**: `src/ui/telegram/index.ts:14-17`

```typescript
FastGlob.sync(path.join(__dirname, 'plugins/*.ts')).forEach(async command => {
  const commandExecutor = (await import(command)).default;
  commandExecutor(bot);
})
```

**Pattern**: Each plugin exports a default function that receives the bot instance:

```typescript
export default (bot: Bot) => {
    bot.command('commandName', async (ctx) => {
        // Command logic
    });
}
```

### 2. Translation System

**Location**: `src/translations/index.ts`

The translation system:
- Auto-discovers language files in the translations directory
- Falls back to English if requested language unavailable
- Uses TypeScript interfaces for type-safe translation keys

**Adding a new language**:
1. Create `src/translations/{langCode}.ts`
2. Implement the `Translations` interface
3. Export as default class

### 3. Prayer Times Service

**Location**: `src/core/api/prayer-times.ts:32-47`

**Singleton pattern** for API service:
```typescript
export const prayerTimeService = new PrayerTimesService();
```

**Key Method**: `getByLatLng(lat, long)`
- Fetches monthly calendar from Aladhan API
- Filters for today's date
- Converts to 12-hour format
- Returns only relevant prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha)

### 4. User Model

**Location**: `src/core/models/User.ts`

Simple data model with:
- `username`: Required identifier
- `displayName`: Optional display name
- `isActive`: Boolean flag (default: true)
- `preferences`: Language and subscription settings

**Note**: There's a typo in the model (`langauge` instead of `language`). Be aware when working with this field.

### 5. Date Utilities

**Location**: `src/core/utils/date.ts`

Key functions:
- `extractDateParts(date)`: Returns year, month, day as strings
- `convertTo12HourClock(timeStr)`: Converts 24h to 12h format with AM/PM
- `getNextPrayerTime(prayerTimes)`: Determines which prayer is next based on current time

---

## Development Workflows

### Environment Setup

1. **Required Environment Variables** (`.env`):
   ```
   BOT_TOKEN=your_telegram_bot_token
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   # Main bot
   npm start

   # Telegram bot with watch mode
   npm run start:tg
   ```

### Adding a New Command

1. Create file: `src/ui/telegram/plugins/{command-name}.command.ts`
2. Implement the plugin pattern:
   ```typescript
   import { Bot } from "..";

   export default (bot: Bot) => {
       bot.command('yourcommand', async (ctx) => {
           // Your logic here
           await ctx.reply('Response');
       });
   }
   ```
3. The command will be auto-loaded on bot startup

### Adding a New Event Handler

Same as commands but use `bot.on()` instead:

```typescript
export default (bot: Bot) => {
    bot.on('message', async (ctx) => {
        // Event logic
    });
}
```

### Extending the API Layer

**Pattern for new services**:
1. Create service class in `src/core/api/`
2. Export singleton instance
3. Use axios instance with proper baseURL
4. Define TypeScript interfaces for responses

---

## Code Conventions & Standards

### TypeScript Configuration

**Key Settings** (`tsconfig.json`):
- **Target**: ES2016
- **Module**: CommonJS
- **Strict Mode**: Enabled
- **Decorators**: Experimental decorators enabled
- **ESM Interop**: Enabled for CommonJS compatibility

### Coding Standards

1. **Naming Conventions**:
   - Files: kebab-case (e.g., `prayer-times.ts`)
   - Classes: PascalCase (e.g., `PrayerTimesService`)
   - Functions/Variables: camelCase
   - Constants: UPPER_SNAKE_CASE (e.g., `BOT_TOKEN`)

2. **File Organization**:
   - One main export per file
   - Group related functionality
   - Use index files for re-exports
   - Plugins must be in `plugins/` directory with `.ts` extension

3. **Import Patterns**:
   - Relative imports for project files
   - Use path aliases from root (via TypeScript)
   - Group imports: external → internal → types

4. **Async/Await**:
   - Prefer async/await over promises
   - Always handle errors in async handlers
   - Use try-catch for error handling in commands

### Known Issues & Quirks

1. **Typo in User Model**: `langauge` instead of `language` in preferences (line 6)
2. **Empty Entry Point**: `src/index.ts` is currently empty (only 1 line)
3. **Hardcoded Web App URL**: Mini app URL is hardcoded in timings.command.ts:8
4. **No Error Handling**: Most plugin handlers lack error handling
5. **Console Logs**: Debug console.logs present in production code

---

## Important Considerations for AI Assistants

### When Making Changes

1. **Preserve the Plugin Pattern**: Always maintain the default export pattern for plugins
2. **Type Safety**: Leverage TypeScript - don't use `any` types
3. **Singleton Services**: Don't create multiple instances of services
4. **Translation Keys**: Always add new keys to the Translations interface
5. **Environment Variables**: Never commit `.env` file or tokens

### Testing Considerations

- No test framework is currently configured
- Manual testing required via Telegram
- Consider adding Jest/Vitest for future testing
- Mini app can be tested independently via Vite dev server

### Security Considerations

1. **Bot Token**: Always use environment variables via `settings.ts`
2. **User Input**: Sanitize location data and user inputs
3. **API Keys**: No API key required for Aladhan API currently
4. **Rate Limiting**: Consider implementing for API calls

### Performance Notes

1. **Plugin Loading**: Auto-loading happens on bot startup (synchronous)
2. **API Caching**: No caching implemented - fetches monthly data each time
3. **Translation Loading**: Dynamic imports may cause slight delays

### Extensibility Points

**Easy to Add**:
- New bot commands (plugin system)
- New languages (translation system)
- New prayer calculation methods (API parameter)
- Additional prayer-related features

**Requires More Work**:
- Database migration from JSON to proper DB
- User authentication/session management
- Scheduled notifications (cron jobs)
- Analytics and logging
- Error reporting system

### Common Tasks for AI Assistants

1. **Adding a new command**: Use plugin pattern, auto-loaded
2. **Fixing the typo in User model**: Update `langauge` → `language` in:
   - `src/core/models/User.ts`
   - `src/db.json`
   - Any references in code
3. **Adding error handling**: Wrap async handlers in try-catch
4. **Implementing notifications**: Will need a job scheduler (node-cron)
5. **Database migration**: Consider TypeORM or Prisma for PostgreSQL/MySQL

### Project Status

**Current State**: Early development / MVP
- Core functionality implemented
- Basic commands working
- Mini app structure in place
- Translations framework ready

**Missing Components**:
- Actual notification system
- User data persistence (using JSON currently)
- Error handling and logging
- Testing suite
- Production deployment configuration
- Documentation (README.md)

---

## Quick Reference

### Run Commands
```bash
npm start           # Run main entry point (currently empty)
npm run start:tg    # Run Telegram bot with watch mode
```

### Key Files to Modify
- **Add command**: `src/ui/telegram/plugins/*.command.ts`
- **Modify bot logic**: `src/ui/telegram/index.ts`
- **Update API**: `src/core/api/prayer-times.ts`
- **Add translations**: `src/translations/{lang}.ts`
- **Configure env**: `.env` (not committed)

### External Resources
- [Telegraf Documentation](https://telegraf.js.org/)
- [Aladhan API Docs](https://aladhan.com/prayer-times-api)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

---

## Contributing Guidelines

When contributing or making changes:

1. Follow existing code patterns and conventions
2. Maintain TypeScript strict mode compliance
3. Use the plugin system for new commands
4. Add translation keys for user-facing strings
5. Test with actual Telegram bot before committing
6. Keep core logic separate from UI concerns
7. Document complex business logic
8. Avoid breaking changes to public APIs

---

*Last Updated: 2025-11-13*
*Project Version: 1.0.0*
