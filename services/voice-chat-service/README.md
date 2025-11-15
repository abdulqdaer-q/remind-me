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

## Configuration

Required environment variables:

```bash
API_ID=12345678                          # Telegram API ID from my.telegram.org
API_HASH=your_api_hash                   # Telegram API hash
BOT_TOKEN=your_bot_token                 # Bot token from @BotFather
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

# Generate proto files
./generate_proto.sh

# Run the service
python src/main.py
```

### Docker

```bash
# Build image
docker build -t voice-chat-service .

# Run container
docker run -e API_ID=xxx -e API_HASH=xxx -e BOT_TOKEN=xxx voice-chat-service
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

- Verify the bot has admin permissions in the group
- Check that the audio URL is accessible
- Ensure ffmpeg is installed in the container

### Connection issues

- Verify API_ID and API_HASH are correct
- Check network connectivity to Telegram servers
- Ensure gRPC port 50053 is not blocked

## Dependencies

- Python 3.11+
- pyrogram: Telegram MTProto API client
- py-tgcalls: Voice chat streaming
- grpcio: gRPC server
- ffmpeg: Audio processing
- aiohttp: HTTP client for downloading audio
