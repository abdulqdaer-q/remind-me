import axios, { AxiosInstance } from 'axios';

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

export interface PrayerTimesData {
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

export class AladhanClient {
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: 'https://api.aladhan.com/v1',
    });
  }

  async getPrayerTimes(
    latitude: number,
    longitude: number,
    date: string = this.getTodayDate()
  ): Promise<PrayerTimesData> {
    const [year, month, day] = date.split('-');

    const url = `/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=4`;

    const { data } = await this.axios.get<AladhanResponse>(url);

    // Find the specific day in the calendar response
    const dayData = data.data.find((e) => e.date.gregorian.day === day);

    if (!dayData) {
      throw new Error(`Prayer times not found for date: ${date}`);
    }

    // Create prayer times array
    const prayers = [
      {
        name: 'Fajr',
        time: this.cleanTimeString(dayData.timings.Fajr),
        time12h: this.convertTo12Hour(this.cleanTimeString(dayData.timings.Fajr))
      },
      {
        name: 'Sunrise',
        time: this.cleanTimeString(dayData.timings.Sunrise),
        time12h: this.convertTo12Hour(this.cleanTimeString(dayData.timings.Sunrise))
      },
      {
        name: 'Dhuhr',
        time: this.cleanTimeString(dayData.timings.Dhuhr),
        time12h: this.convertTo12Hour(this.cleanTimeString(dayData.timings.Dhuhr))
      },
      {
        name: 'Asr',
        time: this.cleanTimeString(dayData.timings.Asr),
        time12h: this.convertTo12Hour(this.cleanTimeString(dayData.timings.Asr))
      },
      {
        name: 'Maghrib',
        time: this.cleanTimeString(dayData.timings.Maghrib),
        time12h: this.convertTo12Hour(this.cleanTimeString(dayData.timings.Maghrib))
      },
      {
        name: 'Isha',
        time: this.cleanTimeString(dayData.timings.Isha),
        time12h: this.convertTo12Hour(this.cleanTimeString(dayData.timings.Isha))
      }
    ];

    return {
      date,
      location: {
        latitude,
        longitude
      },
      prayers
    };
  }

  /**
   * Removes timezone info from time string (e.g., "12:30 (+03)" -> "12:30")
   */
  private cleanTimeString(timeString: string): string {
    return timeString.split(' ')[0];
  }

  /**
   * Convert 24-hour time to 12-hour format
   */
  private convertTo12Hour(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
