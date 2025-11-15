export const config = {
  prayerTimesServiceUrl:
    import.meta.env.VITE_PRAYER_TIMES_SERVICE_URL || 'http://localhost:3002',
  translationServiceUrl:
    import.meta.env.VITE_TRANSLATION_SERVICE_URL || 'http://localhost:3001',
} as const;

export const defaultQueryParams = {
  lat: '33.5138',
  lng: '36.2765',
  lang: 'en',
} as const;

export const fallbackTranslations: Record<string, Record<string, string>> = {
  en: {
    title: 'Prayer Times',
    title_in: 'Prayer Times in',
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },
  ar: {
    title: 'أوقات الصلاة',
    title_in: 'أوقات الصلاة في',
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  },
};
