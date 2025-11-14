/**
 * DateTime utilities for the domain
 */
export class DateTime {
  /**
   * Converts 24-hour time format to 12-hour format with AM/PM
   */
  static to12HourFormat(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time format: ${time24}`);
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Parses a time string in HH:MM format and returns total minutes since midnight
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time format: ${time}`);
    }

    return hours * 60 + minutes;
  }

  /**
   * Gets current time in minutes since midnight
   */
  static getCurrentTimeInMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  /**
   * Formats a date object to YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Gets today's date in YYYY-MM-DD format
   */
  static today(): string {
    return this.formatDate(new Date());
  }
}
