import { PrayerTimes } from '../../domain/prayer/PrayerTimes';
import { PrayerTimesService } from '../../domain/prayer/PrayerTimesService';
import { Location } from '../../domain/location/Location';
import { DateTime } from '../../domain/shared/DateTime';

export interface GetPrayerTimesQuery {
  latitude: number;
  longitude: number;
  date?: string;
}

/**
 * Get Prayer Times Use Case
 * Retrieves prayer times for a specific location and date
 */
export class GetPrayerTimesUseCase {
  constructor(private readonly prayerTimesService: PrayerTimesService) {}

  async execute(query: GetPrayerTimesQuery): Promise<PrayerTimes> {
    const location = Location.create(query.latitude, query.longitude);
    const date = query.date || DateTime.today();

    return await this.prayerTimesService.getPrayerTimes(location, date);
  }
}
