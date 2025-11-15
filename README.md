# Remind Me (Bilal) - Prayer Times Bot

A Telegram bot application built with microservices architecture to help Muslims track prayer times and receive reminders.

## 🏗️ Architecture

This application uses a **microservices architecture** with the following independent services:

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Telegram   │────▶│  Translation     │     │  Prayer Times     │
│     Bot     │     │   Service        │     │    Service        │
│             │     │   (Port 3001)    │     │   (Port 3002)     │
└─────────────┘     └──────────────────┘     └───────────────────┘
       │                     ▲                         ▲
       │                     │                         │
       ▼                     │                         │
┌─────────────┐             │                         │
│   Web App   │─────────────┴─────────────────────────┘
│ (Port 8080) │
└─────────────┘
```

### Services

1. **Translation Service** - Centralized i18n management (English & Arabic)
2. **Prayer Times Service** - Fetches prayer times from Aladhan API
3. **Telegram Bot** - Main application handling user interactions
4. **Web App** - Vite-based frontend for displaying prayer times

For detailed architecture documentation, see [MICROSERVICES_ARCHITECTURE.md](./MICROSERVICES_ARCHITECTURE.md)

## ✨ Features

- 🕌 **Prayer Times**: Get accurate prayer times for any location
- 🌍 **Multi-language**: Full support for English and Arabic (RTL)
- 📱 **Telegram WebApp**: Beautiful web interface for viewing prayer times
- 🔔 **Reminders**: Subscribe to prayer time reminders (coming soon)
- 📊 **Prayer Tracker**: Track your prayer completion (coming soon)
- 📞 **Call Reminders**: Get phone call reminders (coming soon)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd remind-me
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your BOT_TOKEN
```

3. **Run with Docker Compose**
```bash
docker-compose up --build
```

That's it! All services will start automatically.

### Option 2: Local Development

1. **Install dependencies**
```bash
# Root dependencies (bot)
npm install

# Install microservices dependencies
npm run services:install

# Install web app dependencies
cd src/apps/salah-times && npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your BOT_TOKEN
```

3. **Start all services**
```bash
# Start all microservices, bot, and web app
npm run microservices:dev
```

Or start services individually:

```bash
# Terminal 1: Translation Service
npm run services:translation

# Terminal 2: Prayer Times Service
npm run services:prayer-times

# Terminal 3: Bot
npm run dev

# Terminal 4: Web App
npm run webapp
```

## 📋 Available Scripts

### Development
- `npm run dev` - Start bot in development mode
- `npm run microservices:dev` - Start all services in development mode
- `npm run services:translation` - Start translation service only
- `npm run services:prayer-times` - Start prayer times service only
- `npm run webapp` - Start web app only

### Production
- `npm start` - Start bot in production mode
- `npm run build` - Build all TypeScript code
- `npm run services:build` - Build microservices

### Docker
- `npm run docker:up` - Build and start all services with Docker
- `npm run docker:down` - Stop all Docker containers
- `npm run docker:logs` - View Docker logs

### Utilities
- `npm run type-check` - Check TypeScript types
- `npm run services:install` - Install dependencies for all microservices

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# Web App URL (used by the bot to generate mini app links)
WEB_APP_URL=http://localhost:8080

# Microservices URLs (for local development)
TRANSLATION_SERVICE_URL=http://localhost:3001
PRAYER_TIMES_SERVICE_URL=http://localhost:3002

# Vite environment variables for web app
VITE_TRANSLATION_SERVICE_URL=http://localhost:3001
VITE_PRAYER_TIMES_SERVICE_URL=http://localhost:3002
```

### Getting a Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token and add it to your `.env` file

## 🎯 Usage

### Bot Commands

- `/start` - Start the bot and set up your preferences
- `/timings` - View prayer times for your location
- `/subscribe` - Subscribe to prayer reminders

### Setting Up

1. Start a conversation with your bot on Telegram
2. Send `/start` command
3. Select your preferred language (English or Arabic)
4. Share your location
5. Choose which features you want to enable

## 🏛️ Project Structure

```
remind-me/
├── src/                          # Main bot application
│   ├── domain/                   # Domain models and business logic
│   ├── application/              # Use cases
│   ├── infrastructure/           # External dependencies
│   │   ├── api/                  # HTTP clients for microservices
│   │   ├── i18n/                 # Translation service client
│   │   ├── persistence/          # Data storage
│   │   └── telegram/             # Telegram bot setup
│   ├── presentation/             # Handlers and formatters
│   └── apps/
│       └── salah-times/          # Web application
│
├── services/                     # Microservices
│   ├── translation-service/      # Translation API
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── prayer-times-service/     # Prayer Times API
│       ├── src/
│       ├── Dockerfile
│       └── package.json
│
├── docker-compose.yml            # Docker orchestration
├── Dockerfile.bot                # Bot container config
├── Dockerfile.webapp             # Web app container config
└── MICROSERVICES_ARCHITECTURE.md # Architecture docs
```

## 🛠️ Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js 20
- **Bot Framework**: Telegraf
- **Web Framework**: Express.js (microservices), Vite (frontend)
- **HTTP Client**: Axios
- **Containerization**: Docker & Docker Compose
- **External API**: Aladhan Prayer Times API

## 📊 Microservices API

### Translation Service (Port 3001)

```bash
# Get single translation
GET /translate/:language/:key

# Get multiple translations
POST /translate/:language
Body: { "keys": ["fajr", "dhuhr", "asr"] }

# Get all translations
GET /translate/:language

# Health check
GET /health
```

### Prayer Times Service (Port 3002)

```bash
# Get prayer times
GET /prayer-times?lat={latitude}&lng={longitude}&date={YYYY-MM-DD}

# Health check
GET /health
```

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| translation-service | 3001 | Translation API |
| prayer-times-service | 3002 | Prayer Times API |
| bot | N/A | Telegram Bot |
| webapp | 8080 | Web Application |

## 🧪 Testing

```bash
# Test Translation Service
curl http://localhost:3001/health
curl http://localhost:3001/translate/en/fajr

# Test Prayer Times Service
curl http://localhost:3002/health
curl "http://localhost:3002/prayer-times?lat=33.5138&lng=36.2765"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

ISC

## 👤 Author

AbdulQader Qassab

## 🙏 Acknowledgments

- Prayer times data provided by [Aladhan API](https://aladhan.com/prayer-times-api)
- Built with [Telegraf](https://telegraf.js.org/) bot framework

## 📚 Additional Documentation

- [Microservices Architecture](./MICROSERVICES_ARCHITECTURE.md) - Detailed architecture documentation
- [DDD Architecture](./DDD_ARCHITECTURE.md) - Domain-Driven Design documentation

## 🐛 Troubleshooting

### Bot not responding
- Check if BOT_TOKEN is set correctly
- Verify all services are running: `docker-compose ps`
- Check logs: `npm run docker:logs`

### Web app not loading
- Ensure translation and prayer times services are running
- Check browser console for errors
- Verify VITE environment variables are set

### Connection errors
- Make sure all services are on the same Docker network
- Check firewall settings
- Verify service URLs in environment variables

## 🔮 Future Enhancements

- [ ] Redis caching layer
- [ ] PostgreSQL database
- [ ] API Gateway with authentication
- [ ] Message queue for async operations
- [ ] Prometheus monitoring
- [ ] Automated prayer time reminders
- [ ] Prayer completion tracking
- [ ] Call reminder integration
