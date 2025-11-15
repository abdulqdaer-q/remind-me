#!/bin/bash

# Generate Python gRPC code from proto files

# Create generated directory
mkdir -p generated

# Generate Python code
python -m grpc_tools.protoc \
    -I../../proto \
    --python_out=./generated \
    --grpc_python_out=./generated \
    ../../proto/voice-chat.proto

echo "Proto files generated successfully!"
