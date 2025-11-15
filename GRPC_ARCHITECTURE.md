# gRPC Architecture

This document describes the gRPC implementation in the Remind Me (Bilal) prayer times bot application.

## Overview

The application implements a **hybrid microservices architecture** using both **gRPC** and **REST** protocols:

- **gRPC** for service-to-service communication (bot ↔ microservices)
- **REST** for browser-based communication (web app ↔ microservices)

This approach provides the best of both worlds: high-performance binary communication for backend services while maintaining browser compatibility for the web frontend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Telegram Bot Client                      │
│                  (Node.js gRPC Client)                       │
│                                                               │
│  • Connects via gRPC (ports 50051, 50052)                   │
│  • High performance, type-safe communication                │
│  • Binary protocol for fast serialization                   │
└───────────┬─────────────────────────────────┬───────────────┘
            │  gRPC                           │ gRPC
            ├─────────────┐                   │
            │             │                   │
            ▼             ▼                   ▼
  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐
  │ Translation  │  │ Prayer Times   │  │   Web App    │
  │   Service    │  │    Service     │  │  (Browser)   │
  │              │  │                │  │              │
  │ gRPC: 50051  │  │ gRPC: 50052    │  └──────────────┘
  │ REST: 3001   │  │ REST: 3002     │         │
  └──────────────┘  └────────────────┘         │
        ▲                   ▲                   │ REST
        │                   │                   │ HTTP/JSON
        │                   │                   │
        └───────────────────┴───────────────────┘
                   (Browser compatibility)
```

## Why gRPC?

### Advantages

1. **Performance**: Binary protocol (Protocol Buffers) is faster than JSON
2. **Type Safety**: Strong typing with `.proto` definitions
3. **Code Generation**: Automatic client/server code generation
4. **Streaming**: Supports bidirectional streaming (future use)
5. **Language Agnostic**: Works across different programming languages
6. **Smaller Payloads**: Binary format reduces bandwidth usage

### Why Hybrid (gRPC + REST)?

- **Browsers can't directly call gRPC** (requires gRPC-Web proxy)
- REST APIs provide easy browser compatibility
- Services can be consumed by both internal (gRPC) and external (REST) clients

## Protocol Buffer Definitions

### Translation Service Proto

**File**: `proto/translation.proto`

```protobuf
service TranslationService {
  rpc GetTranslation(TranslationRequest) returns (TranslationResponse);
  rpc GetTranslations(TranslationsRequest) returns (TranslationsResponse);
  rpc GetAllTranslations(AllTranslationsRequest) returns (AllTranslationsResponse);
  rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
}
```

**Port Allocation**:
- gRPC: `50051`
- REST: `3001`

### Prayer Times Service Proto

**File**: `proto/prayer-times.proto`

```protobuf
service PrayerTimesService {
  rpc GetPrayerTimes(PrayerTimesRequest) returns (PrayerTimesResponse);
  rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
}
```

**Port Allocation**:
- gRPC: `50052`
- REST: `3002`

## Service Implementation

### Translation Service

**Dual Protocol Server**: `services/translation-service/src/index.ts`

```typescript
// Starts both gRPC (port 50051) and REST (port 3001) servers
startGrpcServer();    // For bot communication
createRestServer();   // For web app communication
```

**gRPC Server**:
- Uses `@grpc/grpc-js` and `@grpc/proto-loader`
- Loads Protocol Buffer definitions dynamically
- Implements unary RPC methods (request-response pattern)

**REST Server**:
- Uses Express.js
- Same business logic as gRPC
- CORS enabled for browser access

### Prayer Times Service

**Dual Protocol Server**: `services/prayer-times-service/src/index.ts`

```typescript
// Starts both gRPC (port 50052) and REST (port 3002) servers
startGrpcServer();    // For bot communication
createRestServer();   // For web app communication
```

## Client Implementation

### Bot gRPC Clients

**Translation Client**: `src/infrastructure/i18n/GrpcTranslationService.ts`

```typescript
export class GrpcTranslationService {
  private client: any;

  constructor(serviceUrl: string = 'localhost:50051') {
    // Load proto and create gRPC client
    const translationProto = grpc.loadPackageDefinition(...);
    this.client = new translationProto.TranslationService(
      serviceUrl,
      grpc.credentials.createInsecure()
    );
  }

  async translate(key, language): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.GetTranslation({language, key}, callback);
    });
  }
}
```

**Prayer Times Client**: `src/infrastructure/api/GrpcPrayerTimesService.ts`

```typescript
export class GrpcPrayerTimesService implements PrayerTimesService {
  private client: any;

  constructor(serviceUrl: string = 'localhost:50052') {
    // Load proto and create gRPC client
    const prayerTimesProto = grpc.loadPackageDefinition(...);
    this.client = new prayerTimesProto.PrayerTimesService(
      serviceUrl,
      grpc.credentials.createInsecure()
    );
  }

  async getPrayerTimes(location, date): Promise<PrayerTimes> {
    return new Promise((resolve, reject) => {
      this.client.GetPrayerTimes({latitude, longitude, date}, callback);
    });
  }
}
```

### Web App REST Clients

The web app continues to use HTTP/REST for browser compatibility:

```typescript
// Fetch from REST endpoints
const response = await fetch(`${TRANSLATION_SERVICE_URL}/translate/en/fajr`);
const data = await response.json();
```

## Port Allocation

| Service | gRPC Port | REST Port | Protocol |
|---------|-----------|-----------|----------|
| Translation Service | 50051 | 3001 | gRPC + REST |
| Prayer Times Service | 50052 | 3002 | gRPC + REST |

**Standard gRPC Port Range**: 50000-50100 (avoiding conflicts with common ports)

## Environment Variables

### Bot Configuration

```env
# Bot uses gRPC for service communication
TRANSLATION_SERVICE_URL=localhost:50051
PRAYER_TIMES_SERVICE_URL=localhost:50052
```

### Web App Configuration

```env
# Web app uses REST for browser compatibility
VITE_TRANSLATION_SERVICE_URL=http://localhost:3001
VITE_PRAYER_TIMES_SERVICE_URL=http://localhost:3002
```

### Docker Configuration

```yaml
translation-service:
  ports:
    - "3001:3001"   # REST API
    - "50051:50051" # gRPC
  environment:
    - REST_PORT=3001
    - GRPC_PORT=50051

prayer-times-service:
  ports:
    - "3002:3002"   # REST API
    - "50052:50052" # gRPC
  environment:
    - REST_PORT=3002
    - GRPC_PORT=50052
```

## Request Flow Examples

### Example 1: Bot Requests Translation (gRPC)

```
1. Bot needs translation for "fajr" in English
   ↓
2. GrpcTranslationService.translate("fajr", Language.EN)
   ↓
3. gRPC call to localhost:50051
   Protocol Buffers binary message:
   {
     language: "en",
     key: "fajr"
   }
   ↓
4. Translation Service receives gRPC request
   ↓
5. Returns Protocol Buffer response:
   {
     key: "fajr",
     language: "en",
     translation: "Fajr"
   }
   ↓
6. Bot receives binary response, deserializes to string: "Fajr"
```

### Example 2: Web App Requests Prayer Times (REST)

```
1. User opens web app, needs prayer times
   ↓
2. JavaScript fetch to http://localhost:3002/prayer-times?lat=33&lng=36
   ↓
3. Prayer Times Service receives HTTP GET request
   ↓
4. Returns JSON response:
   {
     "date": "2024-01-15",
     "location": {"latitude": 33, "longitude": 36},
     "prayers": [...]
   }
   ↓
5. Web app receives JSON, renders prayer times table
```

## Performance Comparison

| Metric | gRPC | REST |
|--------|------|------|
| **Serialization** | Protocol Buffers (binary) | JSON (text) |
| **Payload Size** | ~30% smaller | Baseline |
| **Parsing Speed** | ~5x faster | Baseline |
| **Type Safety** | Compile-time | Runtime |
| **Browser Support** | Requires proxy | Native |

**Typical Response Times** (local network):
- gRPC: 5-10ms
- REST: 10-20ms

## Error Handling

### gRPC Status Codes

```typescript
// Translation Service error handling
if (language !== 'en' && language !== 'ar') {
  return callback({
    code: grpc.status.INVALID_ARGUMENT,
    details: 'Invalid language. Supported languages: en, ar'
  });
}

try {
  // Business logic
  callback(null, response);
} catch (error) {
  callback({
    code: grpc.status.INTERNAL,
    details: error.message
  });
}
```

**Common gRPC Status Codes**:
- `OK` (0): Success
- `INVALID_ARGUMENT` (3): Client specified invalid argument
- `NOT_FOUND` (5): Resource not found
- `INTERNAL` (13): Internal server error
- `UNAVAILABLE` (14): Service unavailable

### Client-Side Error Handling

```typescript
// Bot client with fallback
async translate(key, language): Promise<string> {
  return new Promise((resolve) => {
    this.client.GetTranslation({language, key}, (error, response) => {
      if (error) {
        console.error('gRPC error:', error);
        resolve(`[${key}]`);  // Fallback value
        return;
      }
      resolve(response.translation);
    });
  });
}
```

## Testing gRPC Services

### Using grpcurl (CLI tool)

```bash
# Install grpcurl
brew install grpcurl  # macOS
# or
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# List services
grpcurl -plaintext localhost:50051 list

# Call translation service
grpcurl -plaintext -d '{"language":"en","key":"fajr"}' \
  localhost:50051 translation.TranslationService/GetTranslation

# Call prayer times service
grpcurl -plaintext -d '{"latitude":33.5138,"longitude":36.2765}' \
  localhost:50052 prayertimes.PrayerTimesService/GetPrayerTimes

# Health check
grpcurl -plaintext localhost:50051 translation.TranslationService/HealthCheck
```

### Using BloomRPC (GUI tool)

1. Download BloomRPC: https://github.com/bloomrpc/bloomrpc
2. Import `.proto` files
3. Connect to `localhost:50051` or `localhost:50052`
4. Send requests visually

## Future Enhancements

### 1. gRPC Streaming

Enable real-time updates for prayer time reminders:

```protobuf
service PrayerTimesService {
  rpc StreamPrayerReminders(StreamRequest) returns (stream PrayerReminder);
}
```

### 2. TLS/SSL Encryption

Secure gRPC communication in production:

```typescript
const sslCreds = grpc.credentials.createSsl(
  fs.readFileSync('ca.pem'),
  fs.readFileSync('key.pem'),
  fs.readFileSync('cert.pem')
);

server.bindAsync('0.0.0.0:50051', sslCreds, callback);
```

### 3. Load Balancing

Use Envoy or gRPC load balancer for horizontal scaling:

```yaml
# Envoy configuration
static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address: {address: 0.0.0.0, port_value: 50051}
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        config:
          http2_protocol_options: {}
```

### 4. Service Mesh

Integrate with Istio for advanced traffic management:
- Circuit breaking
- Retry policies
- Observability

### 5. gRPC-Web for Browser

Add gRPC-Web proxy to allow browsers to use gRPC directly:

```
Browser → gRPC-Web Proxy (Envoy) → gRPC Service
```

## Troubleshooting

### Connection Refused

```bash
# Check if gRPC server is running
netstat -an | grep 50051

# Test connection
grpcurl -plaintext localhost:50051 list
```

### Proto File Not Found

```
Error: Failed to load proto file
```

**Solution**: Ensure proto files are copied during Docker build

```dockerfile
# Dockerfile
COPY proto ./proto
```

### Type Mismatch Errors

**Problem**: Proto definition changed but client not updated

**Solution**: Rebuild services after proto changes

```bash
# Rebuild all services
npm run services:build
docker-compose build
```

### Performance Issues

**Monitor with**:
```bash
# Check service metrics
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check

# Monitor Docker containers
docker stats

# Check network latency
ping translation-service
```

## Best Practices

1. **Use Protocol Buffers for all inter-service communication**
2. **Keep REST APIs for browser compatibility**
3. **Version your .proto files** (e.g., `translation_v1.proto`)
4. **Implement proper error handling** with specific status codes
5. **Add health checks** to all gRPC services
6. **Use connection pooling** for better performance
7. **Enable TLS in production** for security
8. **Monitor gRPC metrics** (latency, errors, throughput)

## References

- [gRPC Official Documentation](https://grpc.io/docs/)
- [Protocol Buffers Guide](https://developers.google.com/protocol-buffers)
- [@grpc/grpc-js GitHub](https://github.com/grpc/grpc-node/tree/master/packages/grpc-js)
- [gRPC Best Practices](https://grpc.io/docs/guides/performance/)
