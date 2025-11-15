import { defaultQueryParams } from '../config';
import type { PrayerTimings, QueryParams } from '../types';
import { PRAYER_NAMES } from '../types';
import { telegramMiniApp } from './telegram';

export const parseQueryParams = (): QueryParams => {
  const query = window.location.search
    .replace('?', '')
    .split('&')
    .reduce((acc, param) => {
      if (!param) return acc;
      const [key, value] = param.split('=');
      return { ...acc, [key]: value };
    }, {} as Record<string, string>);

  // Try to get location from Telegram start parameter if available
  const telegramLocation = telegramMiniApp.getLocationFromStartParam();
  const telegramLang = telegramMiniApp.getUserLanguage();

  return {
    lat: query.lat || telegramLocation?.lat || defaultQueryParams.lat,
    lng: query.lng || telegramLocation?.lng || defaultQueryParams.lng,
    lang: query.lang || telegramLang || defaultQueryParams.lang,
  };
};

export const getNextPrayerIndex = (times: PrayerTimings): number => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayerMinutes = PRAYER_NAMES.map((name) => {
    const timeString = times[name];
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  });

  for (let i = 0; i < prayerMinutes.length; i++) {
    if (currentTime < prayerMinutes[i]) {
      return i;
    }
  }

  // If all prayers have passed, next is Fajr tomorrow
  return 0;
};

export const isRtlLanguage = (lang: string): boolean => {
  return lang === 'ar' || lang === 'he' || lang === 'fa' || lang === 'ur';
};

export { telegramMiniApp } from './telegram';
