import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { Language } from '../../domain/shared/Language';
import { Translations } from './TranslationService';

/**
 * gRPC Translation Service Client
 * Communicates with the Translation microservice via gRPC
 */
export class GrpcTranslationService {
  private client: any;

  constructor(serviceUrl: string = process.env.TRANSLATION_SERVICE_URL || 'localhost:50051') {
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

    // Create client
    this.client = new translationProto.TranslationService(
      serviceUrl,
      grpc.credentials.createInsecure()
    );
  }

  async translate(key: keyof Translations, language: Language): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.GetTranslation(
        {
          language: language.code,
          key
        },
        (error: grpc.ServiceError | null, response: any) => {
          if (error) {
            console.error(`Translation service gRPC error for key "${key}":`, error);
            // Fallback to key if service is unavailable
            resolve(`[${key}]`);
            return;
          }
          resolve(response.translation);
        }
      );
    });
  }

  async translateMany(
    keys: (keyof Translations)[],
    language: Language
  ): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      this.client.GetTranslations(
        {
          language: language.code,
          keys
        },
        (error: grpc.ServiceError | null, response: any) => {
          if (error) {
            console.error('Translation service gRPC error for multiple keys:', error);
            // Fallback to keys if service is unavailable
            const result: Record<string, string> = {};
            keys.forEach(key => {
              result[key] = `[${key}]`;
            });
            resolve(result);
            return;
          }
          resolve(response.translations);
        }
      );
    });
  }

  /**
   * Close the gRPC connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
    }
  }
}
