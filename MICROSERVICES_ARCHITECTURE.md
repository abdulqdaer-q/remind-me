# Microservices Architecture

This document describes the microservices architecture for the Remind Me (Bilal) prayer times bot application.

## Overview

The application has been refactored from a monolithic architecture to a microservices architecture, separating concerns into independent, scalable services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Telegram Bot Client                      │
│                  (Main Application - Port N/A)               │
│                                                               │
│  • User interaction                                          │
│  • Command handling (/start, /timings, /subscribe)          │
│  • Session management                                        │
│  • Business logic orchestration                              │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
            │ HTTP                            │ HTTP
            ├─────────────┐                   │
            │             │                   │
            ▼             ▼                   ▼
  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐
  │ Translation  │  │ Prayer Times   │  │   Web App    │
  │   Service    │  │    Service     │  │  (Frontend)  │
  │  Port 3001   │  │   Port 3002    │  │  Port 8080   │
  └──────────────┘  └────────────────┘  └──────────────┘
        │                   │                   │
        │                   │                   │
        │                   │                   │ Calls both services
        │                   │                   │ via HTTP
        │                   │                   │
        │                   └───────────────────┘
        │                   Aladhan API
        │                   (External)
        │
        └─ Translations Database (in-memory)
```

## Services

### 1. Translation Service

**Location:** `services/translation-service/`
**Port:** 3001
**Purpose:** Centralized translation management for all application components

#### API Endpoints

- `GET /health` - Health check endpoint
- `GET /translate/:language/:key` - Get single translation
- `POST /translate/:language` - Get multiple translations (body: `{ keys: string[] }`)
- `GET /translate/:language` - Get all translations for a language

#### Supported Languages

- `en` - English
- `ar` - Arabic (العربية)

#### Example Request

```bash
# Get single translation
curl http://localhost:3001/translate/en/fajr

# Get multiple translations
curl -X POST http://localhost:3001/translate/ar \
  -H "Content-Type: application/json" \
  -d '{"keys": ["fajr", "dhuhr", "asr"]}'

# Get all translations
curl http://localhost:3001/translate/en
```

#### Example Response

```json
{
  "key": "fajr",
  "language": "en",
  "translation": "Fajr"
}
```

### 2. Prayer Times Service

**Location:** `services/prayer-times-service/`
**Port:** 3002
**Purpose:** Fetch and provide prayer times for any location

#### API Endpoints

- `GET /health` - Health check endpoint
- `GET /prayer-times?lat={lat}&lng={lng}&date={YYYY-MM-DD}` - Get prayer times

#### Parameters

- `lat` (required): Latitude (-90 to 90)
- `lng` (required): Longitude (-180 to 180)
- `date` (optional): Date in YYYY-MM-DD format (defaults to today)

#### Example Request

```bash
curl "http://localhost:3002/prayer-times?lat=33.5138&lng=36.2765&date=2024-01-15"
```

#### Example Response

```json
{
  "date": "2024-01-15",
  "location": {
    "latitude": 33.5138,
    "longitude": 36.2765
  },
  "prayers": [
    {
      "name": "Fajr",
      "time": "05:30",
      "time12h": "5:30 AM"
    },
    {
      "name": "Dhuhr",
      "time": "12:15",
      "time12h": "12:15 PM"
    },
    {
      "name": "Asr",
      "time": "15:20",
      "time12h": "3:20 PM"
    },
    {
      "name": "Maghrib",
      "time": "17:45",
      "time12h": "5:45 PM"
    },
    {
      "name": "Isha",
      "time": "19:10",
      "time12h": "7:10 PM"
    }
  ]
}
```

### 3. Telegram Bot (Main Application)

**Location:** `src/`
**Port:** N/A (connects outbound to Telegram)
**Purpose:** Main application orchestrating user interactions

#### Responsibilities

- Handle Telegram bot commands and messages
- Manage user sessions and conversation state
- Coordinate between microservices
- Store user preferences and data
- Generate mini app URLs for the web interface

#### HTTP Clients

- `HttpTranslationService` - Consumes Translation Service API
- `HttpPrayerTimesService` - Consumes Prayer Times Service API

### 4. Web Application (Salah Times)

**Location:** `src/apps/salah-times/`
**Port:** 8080 (in Docker), served via nginx
**Purpose:** Frontend web application for displaying prayer times

#### Features

- Display prayer times in a table format
- Highlight next prayer
- Support English and Arabic (RTL)
- Consume both Translation and Prayer Times microservices

#### Environment Variables

- `VITE_TRANSLATION_SERVICE_URL` - URL of Translation Service
- `VITE_PRAYER_TIMES_SERVICE_URL` - URL of Prayer Times Service

## Technology Stack

| Service | Technology | Port |
|---------|-----------|------|
| Translation Service | Node.js + Express + TypeScript | 3001 |
| Prayer Times Service | Node.js + Express + TypeScript + Axios | 3002 |
| Telegram Bot | Node.js + Telegraf + TypeScript | N/A |
| Web App | Vite + TypeScript + Nginx | 8080 |

## Development Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for containerized setup)

### Local Development (without Docker)

1. **Install dependencies for all services:**

```bash
# Root dependencies (bot)
npm install

# Translation Service
cd services/translation-service
npm install

# Prayer Times Service
cd ../prayer-times-service
npm install

# Web App
cd ../../src/apps/salah-times
npm install
```

2. **Start services in separate terminals:**

```bash
# Terminal 1: Translation Service
cd services/translation-service
npm run dev

# Terminal 2: Prayer Times Service
cd services/prayer-times-service
npm run dev

# Terminal 3: Web App
cd src/apps/salah-times
npm run dev

# Terminal 4: Bot
npm run dev
```

3. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env with your BOT_TOKEN
```

### Docker Setup

1. **Build and run all services:**

```bash
docker-compose up --build
```

2. **Run in detached mode:**

```bash
docker-compose up -d
```

3. **View logs:**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f translation-service
```

4. **Stop services:**

```bash
docker-compose down
```

## Service Communication

### Request Flow Example

```
User sends /timings command
         ↓
Telegram Bot receives command
         ↓
Bot calls Translation Service API
  GET /translate/en/prayer-times-title
         ↓
Bot generates Mini App URL
         ↓
User clicks Mini App button
         ↓
Web App loads
         ↓
Web App calls Translation Service
  POST /translate/en { keys: [...] }
         ↓
Web App calls Prayer Times Service
  GET /prayer-times?lat=X&lng=Y
         ↓
Web App renders prayer times
```

## Benefits of Microservices Architecture

1. **Separation of Concerns**: Each service has a single responsibility
2. **Independent Scaling**: Scale services independently based on load
3. **Technology Flexibility**: Each service can use different technologies
4. **Easier Testing**: Test services in isolation
5. **Better Code Organization**: Clear boundaries between domains
6. **Reusability**: Services can be consumed by multiple clients
7. **Fault Isolation**: Failure in one service doesn't crash the entire application

## Monitoring and Health Checks

Each service exposes a `/health` endpoint for monitoring:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
```

Docker Compose includes health checks that automatically monitor service health.

## Environment Variables

### Bot

- `BOT_TOKEN` - Telegram bot token (required)
- `WEB_APP_URL` - URL of the web app
- `TRANSLATION_SERVICE_URL` - Translation service endpoint
- `PRAYER_TIMES_SERVICE_URL` - Prayer times service endpoint

### Translation Service

- `PORT` - Service port (default: 3001)

### Prayer Times Service

- `PORT` - Service port (default: 3002)

### Web App

- `VITE_TRANSLATION_SERVICE_URL` - Translation service endpoint
- `VITE_PRAYER_TIMES_SERVICE_URL` - Prayer times service endpoint

## API Rate Limiting

The Prayer Times Service uses the Aladhan API, which has rate limits. Consider implementing:

- Caching layer for frequently requested prayer times
- Request throttling to prevent rate limit violations
- Fallback mechanisms for when the external API is unavailable

## Security Considerations

1. **CORS**: Both microservices use CORS middleware to allow cross-origin requests
2. **Input Validation**: All services validate input parameters
3. **Error Handling**: Services return appropriate error codes and messages
4. **No Secrets in Code**: All sensitive data is in environment variables

## Future Enhancements

1. **Service Discovery**: Implement service registry (e.g., Consul, etcd)
2. **API Gateway**: Add API gateway for routing and authentication
3. **Caching Layer**: Add Redis for caching translations and prayer times
4. **Message Queue**: Implement event-driven architecture with RabbitMQ or Kafka
5. **Logging**: Centralized logging with ELK stack
6. **Monitoring**: Add Prometheus and Grafana for metrics
7. **Database**: Move from JSON file storage to proper database (PostgreSQL)

## Troubleshooting

### Service not starting

```bash
# Check logs
docker-compose logs [service-name]

# Rebuild without cache
docker-compose build --no-cache [service-name]
```

### Connection refused errors

- Ensure services are running: `docker-compose ps`
- Check network connectivity: `docker network ls`
- Verify environment variables are set correctly

### Web app can't reach microservices

- Check CORS configuration in services
- Verify `VITE_*` environment variables are set during build
- Check browser console for detailed error messages
