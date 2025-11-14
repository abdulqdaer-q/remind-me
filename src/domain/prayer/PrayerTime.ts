import { DateTime } from '../shared/DateTime';
import { PrayerName } from './PrayerName';

/**
 * Prayer Time Value Object
 * Represents a single prayer time with its name and time
 */
export class PrayerTime {
  private constructor(
    private readonly _name: PrayerName,
    private readonly _time24: string,
    private readonly _time12: string
  ) {}

  static create(name: PrayerName, time24: string): PrayerTime {
    const time12 = DateTime.to12HourFormat(time24);
    return new PrayerTime(name, time24, time12);
  }

  get name(): PrayerName {
    return this._name;
  }

  get time24(): string {
    return this._time24;
  }

  get time12(): string {
    return this._time12;
  }

  /**
   * Returns the time in minutes since midnight
   */
  getTimeInMinutes(): number {
    return DateTime.timeToMinutes(this._time24);
  }

  /**
   * Checks if this prayer time has passed for today
   */
  hasPassed(): boolean {
    const currentMinutes = DateTime.getCurrentTimeInMinutes();
    return this.getTimeInMinutes() < currentMinutes;
  }

  equals(other: PrayerTime): boolean {
    return this._name === other._name && this._time24 === other._time24;
  }

  toString(): string {
    return `${this._name}: ${this._time12}`;
  }
}
