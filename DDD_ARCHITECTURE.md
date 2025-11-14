# Domain-Driven Design Architecture

This document describes the Domain-Driven Design (DDD) architecture used in the Remind Me bot.

## Overview

The application is organized into four main layers following DDD principles:

1. **Domain Layer** - Core business logic and rules
2. **Application Layer** - Use cases and application services
3. **Infrastructure Layer** - External dependencies and implementations
4. **Presentation Layer** - User interface handlers and formatters

## Directory Structure

```
src/
├── domain/                         # Domain Layer (core business logic)
│   ├── user/
│   │   ├── User.ts                 # User aggregate root
│   │   ├── UserId.ts               # User ID value object
│   │   └── UserRepository.ts       # Repository interface
│   ├── prayer/
│   │   ├── PrayerTime.ts           # Prayer time value object
│   │   ├── PrayerTimes.ts          # Prayer times aggregate
│   │   ├── PrayerName.ts           # Prayer name enum
│   │   └── PrayerTimesService.ts   # Domain service interface
│   ├── location/
│   │   └── Location.ts             # Location value object
│   └── shared/
│       ├── DateTime.ts             # Shared date/time utilities
│       └── Language.ts             # Language value object
│
├── application/                    # Application Layer (use cases)
│   ├── user/
│   │   ├── RegisterUserUseCase.ts
│   │   ├── UpdateUserLocationUseCase.ts
│   │   └── SubscribeUserUseCase.ts
│   └── prayer/
│       └── GetPrayerTimesUseCase.ts
│
├── infrastructure/                 # Infrastructure Layer
│   ├── telegram/
│   │   └── TelegramBot.ts          # Bot initialization
│   ├── api/
│   │   └── AladhanPrayerTimesService.ts  # Prayer times API client
│   ├── persistence/
│   │   └── JsonUserRepository.ts         # User repository implementation
│   ├── i18n/
│   │   └── TranslationService.ts         # Translation service
│   └── config/
│       └── Settings.ts             # Configuration
│
└── presentation/                   # Presentation Layer
    └── telegram/
        ├── handlers/               # Command and event handlers
        │   ├── TimingsHandler.ts
        │   ├── SubscribeHandler.ts
        │   └── LocationHandler.ts
        └── formatters/
            └── PrayerTimesFormatter.ts
```

## Layer Descriptions

### Domain Layer

The domain layer contains the core business logic and is independent of external frameworks and libraries.

**Key Concepts:**

- **Value Objects**: Immutable objects that represent concepts without identity (Location, Language, PrayerTime, DateTime)
- **Entities**: Objects with unique identity (User)
- **Aggregates**: Clusters of entities and value objects (User, PrayerTimes)
- **Repository Interfaces**: Define contracts for data persistence
- **Domain Services**: Interfaces for operations that don't naturally fit in entities

**Examples:**
- `User`: Aggregate root managing user profile and preferences
- `PrayerTimes`: Aggregate containing all prayer times for a specific day
- `Location`: Value object representing geographical coordinates
- `Language`: Value object for supported languages

### Application Layer

The application layer orchestrates the flow of data between the domain and infrastructure layers through use cases.

**Use Cases:**
- `RegisterUserUseCase`: Handles user registration and profile updates
- `UpdateUserLocationUseCase`: Updates user location
- `SubscribeUserUseCase`: Subscribes users to prayer reminders
- `GetPrayerTimesUseCase`: Retrieves prayer times for a location

Each use case:
- Receives a command/query object
- Coordinates domain objects
- Calls infrastructure services
- Returns domain objects

### Infrastructure Layer

The infrastructure layer provides implementations of interfaces defined in the domain layer.

**Components:**
- `AladhanPrayerTimesService`: Implements `PrayerTimesService` using Aladhan API
- `JsonUserRepository`: Implements `UserRepository` using JSON file storage
- `TranslationService`: Provides i18n support
- `TelegramBot`: Handles bot initialization and handler registration

### Presentation Layer

The presentation layer handles user interactions and formats data for display.

**Components:**
- **Handlers**: Process commands and events from Telegram
- **Formatters**: Format domain objects for display

## Dependency Injection

The application uses constructor-based dependency injection implemented in `src/index.ts` through a simple Container class.

**Flow:**
1. Infrastructure services are instantiated
2. Use cases receive their dependencies
3. Handlers receive use cases and services
4. Bot is configured with handlers

## Key Design Patterns

### Repository Pattern
- Abstracts data persistence
- Domain defines interfaces, infrastructure implements them
- Example: `UserRepository` interface → `JsonUserRepository` implementation

### Use Case Pattern
- Each use case represents a single business operation
- Encapsulates business logic flow
- Example: `SubscribeUserUseCase` handles the entire subscription workflow

### Value Object Pattern
- Immutable objects representing concepts
- Contain validation logic
- Example: `Location` validates coordinates are within valid ranges

### Aggregate Pattern
- Groups related entities and value objects
- Defines consistency boundaries
- Example: `User` aggregate controls all user-related data

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a clear responsibility
2. **Testability**: Business logic is isolated and easy to test
3. **Maintainability**: Changes are localized to specific layers
4. **Flexibility**: Infrastructure can be swapped without affecting business logic
5. **Domain Focus**: Core business logic is prominent and framework-independent

## Testing Strategy

- **Domain Layer**: Unit tests for business logic
- **Application Layer**: Use case tests with mocked repositories
- **Infrastructure Layer**: Integration tests with real dependencies
- **Presentation Layer**: Handler tests with mocked use cases

## Future Enhancements

1. **Events**: Implement domain events for decoupled communication
2. **CQRS**: Separate read and write models if needed
3. **Event Sourcing**: Store state changes as events
4. **Reminder Scheduler**: Implement scheduled prayer reminders
5. **More Persistence Options**: Add PostgreSQL or MongoDB support
