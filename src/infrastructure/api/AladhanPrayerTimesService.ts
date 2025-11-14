import Axios from 'axios';
import { PrayerTimesService } from '../../domain/prayer/PrayerTimesService';
import { PrayerTimes } from '../../domain/prayer/PrayerTimes';
import { PrayerTime } from '../../domain/prayer/PrayerTime';
import { PrayerName } from '../../domain/prayer/PrayerName';
import { Location } from '../../domain/location/Location';
import { DateTime } from '../../domain/shared/DateTime';

interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface AladhanDateInfo {
  gregorian: {
    date: string;
    day: string;
  };
}

interface AladhanResponse {
  data: Array<{
    timings: AladhanTimings;
    date: AladhanDateInfo;
  }>;
}

/**
 * Aladhan Prayer Times Service Implementation
 * Implements the PrayerTimesService interface using Aladhan API
 */
export class AladhanPrayerTimesService implements PrayerTimesService {
  private readonly axios = Axios.create({
    baseURL: 'https://api.aladhan.com/v1',
  });

  async getPrayerTimes(
    location: Location,
    date: string = DateTime.today()
  ): Promise<PrayerTimes> {
    const [year, month, day] = date.split('-');

    const url = `/calendar/${year}/${month}?latitude=${location.latitude}&longitude=${location.longitude}&method=4`;

    const { data } = await this.axios.get<AladhanResponse>(url);

    // Find the specific day in the calendar response
    const dayData = data.data.find((e) => e.date.gregorian.day === day);

    if (!dayData) {
      throw new Error(`Prayer times not found for date: ${date}`);
    }

    // Create PrayerTime objects for each prayer
    const prayerTimes = [
      PrayerTime.create(
        PrayerName.FAJR,
        this.cleanTimeString(dayData.timings.Fajr)
      ),
      PrayerTime.create(
        PrayerName.DHUHR,
        this.cleanTimeString(dayData.timings.Dhuhr)
      ),
      PrayerTime.create(
        PrayerName.ASR,
        this.cleanTimeString(dayData.timings.Asr)
      ),
      PrayerTime.create(
        PrayerName.MAGHRIB,
        this.cleanTimeString(dayData.timings.Maghrib)
      ),
      PrayerTime.create(
        PrayerName.ISHA,
        this.cleanTimeString(dayData.timings.Isha)
      ),
    ];

    return PrayerTimes.create(date, location, prayerTimes);
  }

  /**
   * Removes timezone info from time string (e.g., "12:30 (+03)" -> "12:30")
   */
  private cleanTimeString(timeString: string): string {
    return timeString.split(' ')[0];
  }
}
