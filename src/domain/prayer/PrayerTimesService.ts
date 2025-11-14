import { PrayerTimes } from './PrayerTimes';
import { Location } from '../location/Location';

/**
 * Prayer Times Service Interface (Domain Service)
 * Defines the contract for fetching prayer times
 */
export interface PrayerTimesService {
  /**
   * Fetches prayer times for a specific location and date
   * @param location - The geographical location
   * @param date - The date in YYYY-MM-DD format (optional, defaults to today)
   */
  getPrayerTimes(location: Location, date?: string): Promise<PrayerTimes>;
}
