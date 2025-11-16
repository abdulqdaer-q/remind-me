#!/bin/bash

# Generate Python gRPC code from proto files

# Activate virtual environment
source venv/bin/activate

# Create src directory if it doesn't exist
mkdir -p src

# Generate Python code directly to src
python -m grpc_tools.protoc \
    -I../../proto \
    --python_out=./src \
    --grpc_python_out=./src \
    ../../proto/voice-chat.proto

echo "Proto files generated successfully!"
