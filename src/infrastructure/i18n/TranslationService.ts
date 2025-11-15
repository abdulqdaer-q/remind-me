import { Language } from '../../domain/shared/Language';

export interface Translations {
  // General messages
  'welcome-message': string;
  'send-location-prompt': string;
  'location-received': string;
  'subscription-success': string;
  'subscription-error-no-location': string;
  'prayer-times-title': string;
  'next-prayer': string;

  // Start command flow
  'start-welcome': string;
  'choose-language': string;
  'language-selected': string;
  'request-location': string;
  'location-saved': string;
  'choose-functionalities': string;
  'functionality-reminder': string;
  'functionality-tracker': string;
  'functionality-remind-by-call': string;
  'setup-complete': string;
  'setup-complete-with-selections': string;
  'button-send-location': string;
  'button-skip': string;
  'title_in': string;

  // Prayer names
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

const translations: Record<string, Translations> = {
  en: {
    // General messages
    'welcome-message': 'Hello! I am Bilal, your prayer times assistant 🕌',
    'send-location-prompt': 'Please send your location to receive prayer times.',
    'location-received': 'Location received! You can now subscribe to prayer reminders.',
    'subscription-success': 'Successfully subscribed to prayer reminders!',
    'subscription-error-no-location': 'Please send your location first before subscribing.',
    'prayer-times-title': 'Prayer Times',
    'next-prayer': 'Next Prayer',

    // Start command flow
    'start-welcome':
      '🕌 Welcome! I am Bilal, your prayer companion.\n\nI will help you stay connected with your prayers.',
    'choose-language': 'Please choose your preferred language:',
    'language-selected': 'Great! Language has been set to English.',
    'request-location':
      'To provide accurate prayer times, I need your location.\n\nPlease share your location using the button below:',
    'location-saved': '✅ Location saved successfully!',
    'choose-functionalities':
      'What features would you like to use?\n\n(You can select multiple options or skip)',
    'functionality-reminder': '🔔 Prayer Reminders',
    'functionality-tracker': '📊 Prayer Tracker',
    'functionality-remind-by-call': '📞 Remind by Call',
    'setup-complete':
      '✅ Setup complete! You can check prayer times anytime using /timings command.',
    'setup-complete-with-selections':
      '✅ Setup complete! Your selected features have been activated.',
    'button-send-location': '📍 Send Location',
    'button-skip': 'Skip',
    'title_in': 'Prayer Times in',

    // Prayer names
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },
  ar: {
    // General messages
    'welcome-message': 'مرحباً! أنا بلال، مساعدك لأوقات الصلاة 🕌',
    'send-location-prompt': 'يرجى إرسال موقعك لتلقي أوقات الصلاة.',
    'location-received': 'تم استلام الموقع! يمكنك الآن الاشتراك في تذكيرات الصلاة.',
    'subscription-success': 'تم الاشتراك بنجاح في تذكيرات الصلاة!',
    'subscription-error-no-location': 'يرجى إرسال موقعك أولاً قبل الاشتراك.',
    'prayer-times-title': 'أوقات الصلاة',
    'next-prayer': 'الصلاة التالية',

    // Start command flow
    'start-welcome':
      '🕌 مرحباً! أنا بلال، رفيقك في الصلاة.\n\nسأساعدك على البقاء على اتصال مع صلواتك.',
    'choose-language': 'يرجى اختيار لغتك المفضلة:',
    'language-selected': 'رائع! تم تعيين اللغة إلى العربية.',
    'request-location':
      'لتقديم أوقات الصلاة الدقيقة، أحتاج إلى موقعك.\n\nيرجى مشاركة موقعك باستخدام الزر أدناه:',
    'location-saved': '✅ تم حفظ الموقع بنجاح!',
    'choose-functionalities':
      'ما هي الميزات التي تريد استخدامها?\n\n(يمكنك اختيار خيارات متعددة أو تخطيها)',
    'functionality-reminder': '🔔 تذكيرات الصلاة',
    'functionality-tracker': '📊 متتبع الصلاة',
    'functionality-remind-by-call': '📞 التذكير بالاتصال',
    'setup-complete': '✅ اكتمل الإعداد! يمكنك التحقق من أوقات الصلاة في أي وقت باستخدام أمر /timings.',
    'setup-complete-with-selections': '✅ اكتمل الإعداد! تم تفعيل الميزات المختارة.',
    'button-send-location': '📍 إرسال الموقع',
    'button-skip': 'تخطي',
    'title_in': 'أوقات الصلاة في',

    // Prayer names
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

    return (
      langTranslations[key] ||
      translations.en[key] ||
      `[Missing translation: ${key}]`
    );
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
