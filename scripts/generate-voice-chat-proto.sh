#!/bin/bash

# Generate TypeScript types for voice-chat service

PROTO_PATH=./proto
OUT_PATH=./src/infrastructure/grpc

mkdir -p $OUT_PATH

# Install grpc-tools if not available
npm install -g grpc-tools

# Generate TypeScript code
npx grpc_tools_node_protoc \
  --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
  --js_out=import_style=commonjs,binary:$OUT_PATH \
  --ts_out=service=grpc-node,mode=grpc-js:$OUT_PATH \
  --grpc_out=grpc_js:$OUT_PATH \
  -I $PROTO_PATH \
  $PROTO_PATH/voice-chat.proto

echo "✅ Voice chat proto files generated!"
