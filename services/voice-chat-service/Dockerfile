FROM python:3.11-slim

# Install Node.js (required by pytgcalls)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install system dependencies for pytgcalls
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    ffmpeg \
    libopus0 \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY services/voice-chat-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code first
COPY services/voice-chat-service/src/ ./src/

# Copy proto file from project root
COPY proto/voice-chat.proto /proto/voice-chat.proto

# Generate gRPC code directly into src
RUN python -m grpc_tools.protoc \
    -I/proto \
    --python_out=/app/src \
    --grpc_python_out=/app/src \
    /proto/voice-chat.proto

# Set Python path
ENV PYTHONPATH=/app

WORKDIR /app/src

# Run the application
CMD ["python", "main.py"]
