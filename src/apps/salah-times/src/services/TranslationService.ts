import { config, fallbackTranslations } from '../config';

class TranslationService {
  private cache: Record<string, Record<string, string>> = {};

  async translate(key: string, lang: string): Promise<string> {
    // Check cache first
    if (this.cache[lang]?.[key]) {
      return this.cache[lang][key];
    }

    try {
      const response = await fetch(
        `${config.translationServiceUrl}/translate/${lang}/${key}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache the translation
      if (!this.cache[lang]) {
        this.cache[lang] = {};
      }
      this.cache[lang][key] = data.translation;

      return data.translation;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return this.getFallbackTranslation(key, lang);
    }
  }

  async translateBatch(keys: string[], lang: string): Promise<string[]> {
    return Promise.all(keys.map((key) => this.translate(key, lang)));
  }

  private getFallbackTranslation(key: string, lang: string): string {
    return fallbackTranslations[lang]?.[key] || fallbackTranslations.en[key] || key;
  }

  clearCache(): void {
    this.cache = {};
  }
}

export const translationService = new TranslationService();
