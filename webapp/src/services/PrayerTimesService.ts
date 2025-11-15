import { config } from '../config';
import type { PrayerTimings, PrayerTimesResponse, PrayerName } from '../types';

class PrayerTimesService {
  async fetchPrayerTimes(lat: string, lng: string, date?: string): Promise<PrayerTimings> {
    const formattedDate = date || this.getTodayDate();
    const url = `${config.prayerTimesServiceUrl}/prayer-times?lat=${lat}&lng=${lng}&date=${formattedDate}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PrayerTimesResponse = await response.json();
      return this.convertResponseToTimings(data);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      throw error;
    }
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private convertResponseToTimings(data: PrayerTimesResponse): PrayerTimings {
    const timings: PrayerTimings = {
      Fajr: '',
      Sunrise: '',
      Dhuhr: '',
      Asr: '',
      Maghrib: '',
      Isha: '',
    };

    data.prayers.forEach((prayer) => {
      const prayerName = prayer.name as PrayerName;
      if (prayerName in timings) {
        timings[prayerName] = prayer.time;
      }
    });

    return timings;
  }
}

export const prayerTimesService = new PrayerTimesService();
