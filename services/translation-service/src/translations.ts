export type Language = 'en' | 'ar';

export interface Translations {
  'welcome-message': string;
  'send-location-prompt': string;
  'location-received': string;
  'location-updated': string;
  'no-location-error': string;
  'subscription-success': string;
  'subscription-already-active': string;
  'unsubscription-success': string;
  'unsubscription-not-active': string;
  'fajr': string;
  'sunrise': string;
  'dhuhr': string;
  'asr': string;
  'maghrib': string;
  'isha': string;
  'prayer-times-title': string;
  'share-location-button': string;
  'view-times-button': string;
  'subscribe-button': string;
  'unsubscribe-button': string;
  'next-prayer': string;
  'time-remaining': string;
  'prayer': string;
  'time': string;
}

const translations: Record<Language, Translations> = {
  en: {
    'welcome-message': 'Welcome! I can help you track prayer times and send reminders.',
    'send-location-prompt': 'Please share your location to get started.',
    'location-received': 'Location received! You can now view prayer times.',
    'location-updated': 'Your location has been updated.',
    'no-location-error': 'Please share your location first.',
    'subscription-success': 'You have been subscribed to prayer reminders.',
    'subscription-already-active': 'You are already subscribed to reminders.',
    'unsubscription-success': 'You have been unsubscribed from prayer reminders.',
    'unsubscription-not-active': 'You are not currently subscribed.',
    'fajr': 'Fajr',
    'sunrise': 'Sunrise',
    'dhuhr': 'Dhuhr',
    'asr': 'Asr',
    'maghrib': 'Maghrib',
    'isha': 'Isha',
    'prayer-times-title': 'Prayer Times',
    'share-location-button': 'Share Location',
    'view-times-button': 'View Prayer Times',
    'subscribe-button': 'Subscribe to Reminders',
    'unsubscribe-button': 'Unsubscribe',
    'next-prayer': 'Next Prayer',
    'time-remaining': 'Time Remaining',
    'prayer': 'Prayer',
    'time': 'Time'
  },
  ar: {
    'welcome-message': 'مرحباً! يمكنني مساعدتك في تتبع أوقات الصلاة وإرسال التذكيرات.',
    'send-location-prompt': 'يرجى مشاركة موقعك للبدء.',
    'location-received': 'تم استلام الموقع! يمكنك الآن عرض أوقات الصلاة.',
    'location-updated': 'تم تحديث موقعك.',
    'no-location-error': 'يرجى مشاركة موقعك أولاً.',
    'subscription-success': 'تم الاشتراك في تذكيرات الصلاة.',
    'subscription-already-active': 'أنت مشترك بالفعل في التذكيرات.',
    'unsubscription-success': 'تم إلغاء الاشتراك من تذكيرات الصلاة.',
    'unsubscription-not-active': 'أنت غير مشترك حالياً.',
    'fajr': 'الفجر',
    'sunrise': 'الشروق',
    'dhuhr': 'الظهر',
    'asr': 'العصر',
    'maghrib': 'المغرب',
    'isha': 'العشاء',
    'prayer-times-title': 'أوقات الصلاة',
    'share-location-button': 'مشاركة الموقع',
    'view-times-button': 'عرض أوقات الصلاة',
    'subscribe-button': 'الاشتراك في التذكيرات',
    'unsubscribe-button': 'إلغاء الاشتراك',
    'next-prayer': 'الصلاة التالية',
    'time-remaining': 'الوقت المتبقي',
    'prayer': 'الصلاة',
    'time': 'الوقت'
  }
};

export function getTranslation(key: keyof Translations, language: Language): string {
  const lang = translations[language];
  if (!lang) {
    return translations.en[key] || key;
  }
  return lang[key] || translations.en[key] || key;
}

export function getTranslations(keys: (keyof Translations)[], language: Language): Record<string, string> {
  const result: Record<string, string> = {};
  keys.forEach(key => {
    result[key] = getTranslation(key, language);
  });
  return result;
}

export function getAllTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}
