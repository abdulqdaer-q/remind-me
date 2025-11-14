import { PrayerTime } from './PrayerTime';
import { PrayerName } from './PrayerName';
import { Location } from '../location/Location';

/**
 * Prayer Times Aggregate
 * Represents all prayer times for a specific date and location
 */
export class PrayerTimes {
  private readonly _prayerTimes: Map<PrayerName, PrayerTime>;

  private constructor(
    private readonly _date: string,
    private readonly _location: Location,
    prayerTimes: PrayerTime[]
  ) {
    this._prayerTimes = new Map();
    prayerTimes.forEach(pt => {
      this._prayerTimes.set(pt.name, pt);
    });
  }

  static create(
    date: string,
    location: Location,
    prayerTimes: PrayerTime[]
  ): PrayerTimes {
    if (prayerTimes.length === 0) {
      throw new Error('Prayer times cannot be empty');
    }
    return new PrayerTimes(date, location, prayerTimes);
  }

  get date(): string {
    return this._date;
  }

  get location(): Location {
    return this._location;
  }

  /**
   * Gets a specific prayer time by name
   */
  getPrayerTime(name: PrayerName): PrayerTime | undefined {
    return this._prayerTimes.get(name);
  }

  /**
   * Gets all prayer times as an array
   */
  getAllPrayerTimes(): PrayerTime[] {
    return Array.from(this._prayerTimes.values());
  }

  /**
   * Finds the next upcoming prayer
   */
  getNextPrayer(): PrayerTime | null {
    const prayerTimes = this.getAllPrayerTimes();
    const upcomingPrayers = prayerTimes.filter(pt => !pt.hasPassed());

    if (upcomingPrayers.length === 0) {
      return null; // All prayers have passed for today
    }

    // Return the first upcoming prayer (they should be in order)
    return upcomingPrayers[0];
  }

  /**
   * Checks if a specific prayer is the next prayer
   */
  isNextPrayer(name: PrayerName): boolean {
    const nextPrayer = this.getNextPrayer();
    return nextPrayer?.name === name;
  }

  /**
   * Gets the count of prayer times
   */
  get count(): number {
    return this._prayerTimes.size;
  }
}
