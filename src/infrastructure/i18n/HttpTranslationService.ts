import Axios, { AxiosInstance } from 'axios';
import { Language } from '../../domain/shared/Language';
import { Translations } from './TranslationService';

/**
 * HTTP Translation Service Client
 * Communicates with the Translation microservice via REST API
 */
export class HttpTranslationService {
  private readonly axios: AxiosInstance;

  constructor(baseURL: string = process.env.TRANSLATION_SERVICE_URL || 'http://localhost:3001') {
    this.axios = Axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async translate(key: keyof Translations, language: Language): Promise<string> {
    try {
      const response = await this.axios.get(`/translate/${language.code}/${key}`);
      return response.data.translation;
    } catch (error) {
      console.error(`Translation service error for key "${key}":`, error);
      // Fallback to key if service is unavailable
      return `[${key}]`;
    }
  }

  async translateMany(
    keys: (keyof Translations)[],
    language: Language
  ): Promise<Record<string, string>> {
    try {
      const response = await this.axios.post(`/translate/${language.code}`, {
        keys,
      });
      return response.data.translations;
    } catch (error) {
      console.error('Translation service error for multiple keys:', error);
      // Fallback to keys if service is unavailable
      const result: Record<string, string> = {};
      keys.forEach(key => {
        result[key] = `[${key}]`;
      });
      return result;
    }
  }
}
