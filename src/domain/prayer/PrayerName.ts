/**
 * Prayer Name Value Object
 * Represents the five daily Islamic prayers
 */
export enum PrayerName {
  FAJR = 'Fajr',
  DHUHR = 'Dhuhr',
  ASR = 'Asr',
  MAGHRIB = 'Maghrib',
  ISHA = 'Isha'
}

export const ALL_PRAYERS: PrayerName[] = [
  PrayerName.FAJR,
  PrayerName.DHUHR,
  PrayerName.ASR,
  PrayerName.MAGHRIB,
  PrayerName.ISHA
];
