import { Language } from '../../domain/shared/Language';

export interface Translations {
  'welcome-message': string;
  'send-location-prompt': string;
  'location-received': string;
  'subscription-success': string;
  'subscription-error-no-location': string;
  'prayer-times-title': string;
  'next-prayer': string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

const translations: Record<string, Translations> = {
  en: {
    'welcome-message': 'Hello! I am Bilal, your prayer times assistant 🕌',
    'send-location-prompt': 'Please send your location to receive prayer times.',
    'location-received': 'Location received! You can now subscribe to prayer reminders.',
    'subscription-success': 'Successfully subscribed to prayer reminders!',
    'subscription-error-no-location': 'Please send your location first before subscribing.',
    'prayer-times-title': 'Prayer Times',
    'next-prayer': 'Next Prayer',
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },
  ar: {
    'welcome-message': 'مرحباً! أنا بلال، مساعدك لأوقات الصلاة 🕌',
    'send-location-prompt': 'يرجى إرسال موقعك لتلقي أوقات الصلاة.',
    'location-received': 'تم استلام الموقع! يمكنك الآن الاشتراك في تذكيرات الصلاة.',
    'subscription-success': 'تم الاشتراك بنجاح في تذكيرات الصلاة!',
    'subscription-error-no-location': 'يرجى إرسال موقعك أولاً قبل الاشتراك.',
    'prayer-times-title': 'أوقات الصلاة',
    'next-prayer': 'الصلاة التالية',
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  },
};

/**
 * Translation Service
 * Provides translations for different languages
 */
export class TranslationService {
  translate(key: keyof Translations, language: Language): string {
    const langTranslations = translations[language.code];

    if (!langTranslations) {
      // Fallback to English
      return translations.en[key] || `[Missing translation: ${key}]`;
    }

    return langTranslations[key] || translations.en[key] || `[Missing translation: ${key}]`;
  }

  translateMany(
    keys: (keyof Translations)[],
    language: Language
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of keys) {
      result[key] = this.translate(key, language);
    }
    return result;
  }
}
