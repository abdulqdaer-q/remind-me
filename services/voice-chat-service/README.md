# Voice Chat Service

A Python microservice using Pyrogram and pytgcalls to handle Telegram voice chat streaming for azan broadcasts.

## Overview

This service provides voice chat streaming capabilities that are not available in TypeScript/Node.js libraries. It uses:

- **Pyrogram**: Modern Telegram MTProto API framework for Python
- **pytgcalls**: Python library for interacting with Telegram voice chats
- **gRPC**: Communication protocol with the main TypeScript bot

## Features

- Stream audio to Telegram group voice chats
- Start/stop voice chats programmatically
- Automatic cleanup of temporary files
- Health check endpoint

## Architecture

```
┌─────────────────────┐         gRPC          ┌──────────────────────┐
│   TypeScript Bot    │ ◄───────────────────► │  Voice Chat Service  │
│   (Telegraf)        │    Port 50053         │    (Pyrogram)        │
└─────────────────────┘                       └──────────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Telegram API                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Important: User Account Required

This service uses a **USER account** (not the bot) for voice chat streaming. This is because:

1. **Avoids conflicts**: The main bot is already using the bot token
2. **Better support**: pytgcalls works better with user accounts
3. **More features**: User accounts have fewer limitations with voice chats

**Setup Requirements:**
- A separate Telegram account (use a different phone number, NOT your main account)
- This account must be admin in groups where you want to broadcast azan
- The account must have permission to manage voice chats

## Configuration

### Step 1: Get API Credentials

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Go to "API development tools"
4. Create a new application
5. Copy the `api_id` and `api_hash`

### Step 2: Generate Session String

Run the session generator script:

```bash
cd services/voice-chat-service
python generate_session.py
```

This will:
- Prompt you to enter a phone number (use a SEPARATE account)
- Send you a verification code
- Generate a session string

**IMPORTANT**: Keep the session string SECRET! It gives full access to that Telegram account.

### Step 3: Environment Variables

Required environment variables:

```bash
API_ID=12345678                          # Telegram API ID from my.telegram.org
API_HASH=your_api_hash                   # Telegram API hash
SESSION_STRING=your_session_string       # Generated from generate_session.py
VOICE_CHAT_GRPC_PORT=50053              # gRPC server port (default: 50053)
```

## gRPC API

### StreamAzan

Stream azan audio to a group voice chat.

```protobuf
rpc StreamAzan (StreamAzanRequest) returns (StreamAzanResponse);

message StreamAzanRequest {
  int64 chat_id = 1;      // Group chat ID
  string audio_url = 2;   // URL of audio file to stream
}
```

### StartVoiceChat

Start a voice chat in a group.

```protobuf
rpc StartVoiceChat (StartVoiceChatRequest) returns (StartVoiceChatResponse);
```

### StopVoiceChat

Stop a voice chat in a group.

```protobuf
rpc StopVoiceChat (StopVoiceChatRequest) returns (StopVoiceChatResponse);
```

### HealthCheck

Check service health.

```protobuf
rpc HealthCheck (HealthCheckRequest) returns (HealthCheckResponse);
```

## Development

### Generate gRPC code

```bash
./generate_proto.sh
```

### Run locally

```bash
# Install dependencies
pip install -r requirements.txt

# Generate session string (first time only)
python generate_session.py

# Generate proto files
./generate_proto.sh

# Set environment variables in .env file:
# API_ID=...
# API_HASH=...
# SESSION_STRING=...

# Run the service
python src/main.py
```

### Docker

```bash
# Build image
docker build -t voice-chat-service .

# Run container
docker run -e API_ID=xxx -e API_HASH=xxx -e SESSION_STRING=xxx voice-chat-service
```

## How It Works

1. The TypeScript bot receives a request to broadcast azan
2. Bot sends gRPC request to voice chat service with chat ID and audio URL
3. Voice chat service:
   - Downloads the audio file to a temporary location
   - Joins the voice chat (or creates one if needed)
   - Streams the audio using pytgcalls
   - Leaves the voice chat when done
   - Cleans up temporary files
4. Returns success/failure status to the bot

## Troubleshooting

### "No active voice chat" error

The service tries to create a voice chat automatically. If this fails, manually start a voice chat in the group first.

### Audio not streaming

- Verify the **user account** (not bot) is admin in the group with voice chat permissions
- Check that the audio URL is accessible
- Ensure ffmpeg is installed in the container

### Connection issues

- Verify API_ID and API_HASH are correct
- Verify SESSION_STRING is valid (regenerate if needed)
- Check network connectivity to Telegram servers
- Ensure gRPC port 50053 is not blocked

### "Session string is corrupted or incompatible" error

If you see `struct.error: unpack requires a buffer of 271 bytes`, the session string was generated with an older version of Pyrogram and needs to be regenerated:

```bash
cd services/voice-chat-service
python generate_session.py
```

Copy the new SESSION_STRING to your `.env` file and restart the service

### "Two bot instances" error

If you see conflicts:
- Make sure you're using SESSION_STRING (user account), NOT BOT_TOKEN
- The Python service should use a separate user account
- The TypeScript bot uses the BOT_TOKEN

## Dependencies

- Python 3.11+
- pyrogram: Telegram MTProto API client
- py-tgcalls: Voice chat streaming
- grpcio: gRPC server
- ffmpeg: Audio processing
- aiohttp: HTTP client for downloading audio
