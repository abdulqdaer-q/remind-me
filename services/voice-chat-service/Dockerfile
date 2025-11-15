FROM python:3.11-slim

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
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy proto files and generate gRPC code
COPY ../../proto/voice-chat.proto /proto/
RUN mkdir -p /app/generated && \
    python -m grpc_tools.protoc \
    -I/proto \
    --python_out=/app/generated \
    --grpc_python_out=/app/generated \
    /proto/voice-chat.proto

# Copy application code
COPY src/ ./src/

# Set Python path
ENV PYTHONPATH=/app

WORKDIR /app/src

# Run the application
CMD ["python", "main.py"]
