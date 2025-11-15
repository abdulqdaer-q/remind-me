export interface Prayer {
  name: string;
  time: string;
  time12h: string;
}

export interface PrayerTimesResponse {
  date: string;
  location: {
    latitude: number;
    longitude: number;
  };
  prayers: Prayer[];
}

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface QueryParams {
  lat: string;
  lng: string;
  lang: string;
}

export type PrayerName = keyof PrayerTimings;

export const PRAYER_NAMES: readonly PrayerName[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
] as const;

export const PRAYER_KEYS: readonly string[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
] as const;
