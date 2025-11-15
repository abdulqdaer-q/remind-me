# Remind Me (Bilal) - Prayer Times Bot

A Telegram bot application built with **microservices architecture** and **gRPC** to help Muslims track prayer times and receive reminders with voice call and voice chat capabilities.

## 🏗️ Architecture

This application uses a **polyglot microservices architecture** with dual protocol support:

- **gRPC** for high-performance service-to-service communication (bot ↔ microservices)
- **REST** for browser compatibility (web app ↔ microservices)
- **Hybrid stack**: TypeScript for bot logic, Python for voice operations

```
┌──────────────┐  gRPC  ┌──────────────────┐     ┌──────────────────┐
│  Telegram    │───────▶│ Translation      │     │ Prayer Times     │
│     Bot      │        │ Service          │     │ Service          │
│ (TypeScript) │        │ gRPC: 50051      │     │ gRPC: 50052      │
│              │        │ REST: 3001       │     │ REST: 3002       │
└──────────────┘        └──────────────────┘     └──────────────────┘
       │                        ▲                         ▲
       │ gRPC                   │ REST                    │ REST
       ▼                        │                         │
┌──────────────┐         ┌─────┴─────────────────────────┘
│ Voice Chat   │         │
│ Service      │         │   ┌──────────────┐
│ (Python)     │         └──▶│   Web App    │
│ gRPC: 50053  │             │ (Port 8080)  │
└──────────────┘             └──────────────┘
       │
       ▼
┌──────────────┐
│  Telegram    │
│   API        │
│ (Voice/Chat) │
└──────────────┘
```

### Services

1. **Translation Service** (TypeScript) - Centralized i18n management (English & Arabic)
   - gRPC port: `50051` (bot communication)
   - REST port: `3001` (web app communication)

2. **Prayer Times Service** (TypeScript) - Fetches prayer times from Aladhan API
   - gRPC port: `50052` (bot communication)
   - REST port: `3002` (web app communication)

3. **Voice Chat Service** (Python) - Handles voice calls and voice chat streaming
   - gRPC port: `50053` (bot communication)
   - Uses Pyrogram + pytgcalls for Telegram voice operations
   - Supports 1-on-1 calls and group voice chat broadcasting

4. **Telegram Bot** (TypeScript) - Main application handling user interactions
   - Uses gRPC clients for fast, type-safe communication
   - Domain-Driven Design (DDD) architecture

5. **Web App** (TypeScript) - Vite-based frontend for displaying prayer times
   - Uses REST APIs for browser compatibility

For detailed architecture documentation, see:
- [MICROSERVICES_ARCHITECTURE.md](./MICROSERVICES_ARCHITECTURE.md) - Microservices design
- [GRPC_ARCHITECTURE.md](./GRPC_ARCHITECTURE.md) - gRPC implementation details

## ✨ Features

### Core Features
- 🕌 **Prayer Times**: Get accurate prayer times for any location
- 🌍 **Multi-language**: Full support for English and Arabic (RTL)
- 📱 **Telegram WebApp**: Beautiful web interface for viewing prayer times
- 🔔 **Prayer Reminders**: Automated reminders at prayer times
  - 10 minutes before prayer
  - At prayer time
  - 5 minutes after prayer

### Voice Features
- 📞 **Voice Call Reminders**: Receive automated voice calls with azan for individual users
  - User-configurable via "Remind by Call" setting
  - Plays azan audio during call
  - Auto-hangup after 3 minutes
  - Graceful fallback to text messages

- 🔊 **Group Voice Chat Broadcasting**: Stream azan to group voice chats
  - Automatic voice chat creation
  - High-quality audio streaming via pytgcalls
  - Fallback to voice messages if streaming unavailable

### User Management
- 📍 **Location-based**: Prayer times based on your GPS location
- ⚙️ **Customizable Settings**: Enable/disable features per user
- 👥 **Group Support**: Works in both private chats and groups

### Coming Soon
- 📊 **Prayer Tracker**: Track your prayer completion
- 📈 **Statistics**: View your prayer history and streaks

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
cd webapp && npm install
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

# Microservices URLs for Bot (gRPC)
TRANSLATION_SERVICE_URL=localhost:50051
PRAYER_TIMES_SERVICE_URL=localhost:50052
VOICE_CHAT_SERVICE_URL=localhost:50053

# Microservices URLs for Web App (REST)
VITE_TRANSLATION_SERVICE_URL=http://localhost:3001
VITE_PRAYER_TIMES_SERVICE_URL=http://localhost:3002

# Voice Chat Service Configuration (Python Pyrogram)
# Required for voice calls and voice chat broadcasting
# Get API_ID and API_HASH from https://my.telegram.org
API_ID=12345678
API_HASH=your_api_hash_here

# Session string for voice chat user account
# Generate this by running: cd services/voice-chat-service && python generate_session.py
# IMPORTANT: Use a separate Telegram account (not your main account or the bot)
SESSION_STRING=your_session_string_here
```

### Getting a Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token and add it to your `.env` file

### Setting Up Voice Chat Service

Voice call and voice chat features require additional setup:

#### Step 1: Get Telegram API Credentials

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Go to "API development tools"
4. Create a new application
5. Copy the `api_id` and `api_hash` to your `.env` file

#### Step 2: Generate Session String

**IMPORTANT**: Use a **separate Telegram account** for the voice chat service (not your main account or the bot).

```bash
cd services/voice-chat-service
python generate_session.py
```

This will:
- Prompt you to enter a phone number (use a separate account)
- Send you a verification code
- Generate a session string
- Display it for you to copy to `.env`

**Security Note**: Keep the session string SECRET! It gives full access to that Telegram account.

#### Step 3: Add User Account to Groups

For group voice chat broadcasting:
1. Add your bot to the group
2. Add the user account (phone number used for session string) to the same group
3. Make both admins with "Manage Voice Chats" permission

For more details, see [Voice Chat Service README](./services/voice-chat-service/README.md).

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
├── src/                          # Main bot application (TypeScript)
│   ├── domain/                   # Domain models and business logic
│   ├── application/              # Use cases
│   │   └── reminder/             # Prayer reminder scheduler
│   ├── infrastructure/           # External dependencies
│   │   ├── api/                  # gRPC clients for microservices
│   │   ├── i18n/                 # Translation service client
│   │   ├── persistence/          # Data storage
│   │   └── telegram/             # Telegram bot setup
│   │       ├── VoiceChatService.ts    # gRPC client for voice chat
│   │       └── NotificationService.ts  # Notification handler
│   └── presentation/             # Handlers and formatters
│
├── services/                     # Microservices
│   ├── translation-service/      # Translation API (TypeScript)
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── prayer-times-service/     # Prayer Times API (TypeScript)
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── voice-chat-service/       # Voice Chat API (Python)
│       ├── src/
│       │   ├── main.py           # Service entry point
│       │   ├── voice_chat.py     # Pyrogram voice logic
│       │   └── grpc_server.py    # gRPC server
│       ├── generate_session.py   # Session string generator
│       ├── Dockerfile
│       ├── requirements.txt
│       └── README.md
│
├── proto/                        # Protocol Buffer definitions
│   └── voice-chat.proto          # Voice chat gRPC API
│
├── webapp/                       # Web application (Vite)
│
├── docker-compose.yml            # Docker orchestration
├── Dockerfile.bot                # Bot container config
├── Dockerfile.webapp             # Web app container config
└── MICROSERVICES_ARCHITECTURE.md # Architecture docs
```

## 🛠️ Technology Stack

### TypeScript Services
- **Language**: TypeScript
- **Runtime**: Node.js 20
- **Bot Framework**: Telegraf
- **RPC Framework**: gRPC (@grpc/grpc-js, Protocol Buffers)
- **Web Framework**: Express.js (REST APIs), Vite (frontend)
- **HTTP Client**: Axios

### Python Services
- **Language**: Python 3.11+
- **Telegram Framework**: Pyrogram 2.0
- **Voice Chat**: pytgcalls 0.9
- **RPC Framework**: gRPC (grpcio)
- **Async Runtime**: asyncio

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Protocols**: gRPC (services), REST (web app)
- **External APIs**:
  - Aladhan Prayer Times API
  - Telegram MTProto API (for voice operations)

### Why gRPC?

- **Performance**: Binary protocol (Protocol Buffers) is faster than JSON
- **Type Safety**: Strong typing with `.proto` definitions
- **Smaller Payloads**: ~30% size reduction compared to JSON
- **Polyglot**: Seamless TypeScript ↔ Python communication
- **Streaming**: Supports bi-directional streaming

### Why Pyrogram for Voice?

- **Native Support**: Full MTProto implementation for voice operations
- **pytgcalls Integration**: Best-in-class voice chat streaming
- **User Account Support**: Can use user sessions (required for voice features)
- **Modern Async**: Built on asyncio for high performance
- **Better than Bot API**: Voice chat features unavailable in standard Telegram Bot API

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

| Service | Ports | Stack | Description |
|---------|-------|-------|-------------|
| translation-service | 3001 (REST), 50051 (gRPC) | TypeScript | Translation API |
| prayer-times-service | 3002 (REST), 50052 (gRPC) | TypeScript | Prayer Times API |
| voice-chat-service | 50053 (gRPC) | Python | Voice Chat/Call API |
| bot | N/A | TypeScript | Telegram Bot |
| webapp | 8080 | TypeScript | Web Application |

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
- [Voice Chat Service README](./services/voice-chat-service/README.md) - Voice chat setup and API documentation
- [Group Registration](./docs/GROUP_REGISTRATION.md) - How to set up the bot in groups

## 🎭 Dual Account Architecture

This bot uses **two Telegram accounts** to provide full functionality:

### Bot Account (BOT_TOKEN)
- Handles commands and messages
- Sends text notifications
- Manages user interactions
- Created via @BotFather

### User Account (SESSION_STRING)
- Makes voice calls to users
- Streams audio to group voice chats
- Requires a real Telegram account with phone number
- Should be a **separate account** (not your personal account)

### Why Two Accounts?

Telegram's Bot API has limitations with voice features:
- ❌ Bots **cannot** make voice calls
- ❌ Bots **cannot** stream to voice chats
- ✅ User accounts **can** do both

**Solution**: Use a bot for messaging + user account for voice operations.

### Group Setup Example

For group voice chat broadcasting:

```
Group Members:
├── @YourBot (bot account)           ← Admin for sending messages
└── @VoiceChatUser (user account)    ← Admin for voice chat operations
```

Both must be admins with appropriate permissions.

## 🐛 Troubleshooting

### Bot not responding
- Check if BOT_TOKEN is set correctly
- Verify all services are running: `docker-compose ps`
- Check logs: `npm run docker:logs`
- Ensure all gRPC ports are not blocked (50051, 50052, 50053)

### Voice calls not working
- Verify SESSION_STRING is generated and set in `.env`
- Check that API_ID and API_HASH are correct
- Ensure the user account (not bot) is admin in groups
- Check voice chat service logs: `docker-compose logs voice-chat-service`
- Verify the service is running: `docker-compose ps voice-chat-service`
- Make sure both bot and user account are in the group

### Voice chat streaming issues
- Check that ffmpeg is installed in the voice chat container
- Verify audio URL is accessible
- Ensure the user account has "Manage Voice Chats" permission
- Try manually starting a voice chat first

### Web app not loading
- Ensure translation and prayer times services are running
- Check browser console for errors
- Verify VITE environment variables are set

### Connection errors
- Make sure all services are on the same Docker network
- Check firewall settings
- Verify service URLs in environment variables
- For voice chat: ensure gRPC port 50053 is open

### Session string errors
- Regenerate session string: `cd services/voice-chat-service && python generate_session.py`
- Use a different Telegram account (not your main account)
- Verify the phone number has access to Telegram

## 🔮 Future Enhancements

- [ ] Redis caching layer
- [ ] PostgreSQL database
- [ ] API Gateway with authentication
- [ ] Message queue for async operations
- [ ] Prometheus monitoring
- [x] ~~Automated prayer time reminders~~ ✅ Implemented
- [ ] Prayer completion tracking
- [x] ~~Call reminder integration~~ ✅ Implemented
- [x] ~~Voice chat broadcasting~~ ✅ Implemented
- [ ] Video call support
- [ ] Screen sharing in voice chats
- [ ] Recording voice chats
