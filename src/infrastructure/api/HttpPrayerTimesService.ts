import Axios, { AxiosInstance } from 'axios';
import { PrayerTimesService } from '../../domain/prayer/PrayerTimesService';
import { PrayerTimes } from '../../domain/prayer/PrayerTimes';
import { PrayerTime } from '../../domain/prayer/PrayerTime';
import { PrayerName } from '../../domain/prayer/PrayerName';
import { Location } from '../../domain/location/Location';
import { DateTime } from '../../domain/shared/DateTime';

interface PrayerTimesResponse {
  date: string;
  location: {
    latitude: number;
    longitude: number;
  };
  prayers: {
    name: string;
    time: string;
    time12h: string;
  }[];
}

/**
 * HTTP Prayer Times Service Client
 * Communicates with the Prayer Times microservice via REST API
 */
export class HttpPrayerTimesService implements PrayerTimesService {
  private readonly axios: AxiosInstance;

  constructor(baseURL: string = process.env.PRAYER_TIMES_SERVICE_URL || 'http://localhost:3002') {
    this.axios = Axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  async getPrayerTimes(
    location: Location,
    date: string = DateTime.today()
  ): Promise<PrayerTimes> {
    try {
      const response = await this.axios.get<PrayerTimesResponse>('/prayer-times', {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          date,
        },
      });

      const { data } = response;

      // Map prayer names to PrayerName enum
      const prayerNameMap: Record<string, PrayerName> = {
        'Fajr': PrayerName.FAJR,
        'Dhuhr': PrayerName.DHUHR,
        'Asr': PrayerName.ASR,
        'Maghrib': PrayerName.MAGHRIB,
        'Isha': PrayerName.ISHA,
      };

      // Create PrayerTime objects for each prayer
      const prayerTimes = data.prayers.map((prayer) => {
        const prayerName = prayerNameMap[prayer.name];
        if (!prayerName) {
          throw new Error(`Unknown prayer name: ${prayer.name}`);
        }
        return PrayerTime.create(prayerName, prayer.time);
      });

      return PrayerTimes.create(data.date, location, prayerTimes);
    } catch (error) {
      console.error('Prayer times service error:', error);
      throw new Error(
        `Failed to fetch prayer times from microservice: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
