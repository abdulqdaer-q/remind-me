import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { getTranslation, getTranslations, getAllTranslations, Language, Translations } from './translations';
import { createRestServer } from './rest-server';

const GRPC_PORT = process.env.GRPC_PORT || 50051;
const REST_PORT = process.env.REST_PORT || 3001;
const PROTO_PATH = path.join(__dirname, '../../../proto/translation.proto');

// Load proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const translationProto = grpc.loadPackageDefinition(packageDefinition).translation as any;

// Implement gRPC service methods
const translationService = {
  // Get single translation
  GetTranslation: (call: any, callback: any) => {
    const { language, key } = call.request;

    if (language !== 'en' && language !== 'ar') {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'Invalid language. Supported languages: en, ar'
      });
    }

    try {
      const translation = getTranslation(key as keyof Translations, language as Language);
      callback(null, {
        key,
        language,
        translation
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get multiple translations
  GetTranslations: (call: any, callback: any) => {
    const { language, keys } = call.request;

    if (language !== 'en' && language !== 'ar') {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'Invalid language. Supported languages: en, ar'
      });
    }

    if (!Array.isArray(keys)) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'Invalid request. Expected keys array'
      });
    }

    try {
      const translations = getTranslations(keys as (keyof Translations)[], language as Language);
      callback(null, {
        language,
        translations
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get all translations
  GetAllTranslations: (call: any, callback: any) => {
    const { language } = call.request;

    if (language !== 'en' && language !== 'ar') {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'Invalid language. Supported languages: en, ar'
      });
    }

    try {
      const translations = getAllTranslations(language as Language);
      callback(null, {
        language,
        translations
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Health check
  HealthCheck: (call: any, callback: any) => {
    callback(null, {
      status: 'healthy',
      service: 'translation-service'
    });
  }
};

// Create and start gRPC server
function startGrpcServer() {
  const server = new grpc.Server();

  server.addService(translationProto.TranslationService.service, translationService);

  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error('Failed to start gRPC server:', error);
        process.exit(1);
      }
      console.log(`Translation Service (gRPC) running on port ${port}`);
      console.log(`Protocol: gRPC`);
      console.log(`Proto file: ${PROTO_PATH}`);
    }
  );
}

// Start both servers
console.log('Starting Translation Service with dual protocol support...');
startGrpcServer();
createRestServer(Number(REST_PORT));
