import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { PrayerTimesService } from '../../domain/prayer/PrayerTimesService';
import { PrayerTimes } from '../../domain/prayer/PrayerTimes';
import { PrayerTime } from '../../domain/prayer/PrayerTime';
import { PrayerName } from '../../domain/prayer/PrayerName';
import { Location } from '../../domain/location/Location';
import { DateTime } from '../../domain/shared/DateTime';

/**
 * gRPC Prayer Times Service Client
 * Communicates with the Prayer Times microservice via gRPC
 */
export class GrpcPrayerTimesService implements PrayerTimesService {
  private client: any;

  constructor(serviceUrl: string = process.env.PRAYER_TIMES_SERVICE_URL || 'localhost:50052') {
    const PROTO_PATH = path.join(__dirname, '../../../proto/prayer-times.proto');

    // Load proto file
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    const prayerTimesProto = grpc.loadPackageDefinition(packageDefinition).prayertimes as any;

    // Create client
    this.client = new prayerTimesProto.PrayerTimesService(
      serviceUrl,
      grpc.credentials.createInsecure()
    );
  }

  async getPrayerTimes(
    location: Location,
    date: string = DateTime.today()
  ): Promise<PrayerTimes> {
    return new Promise((resolve, reject) => {
      this.client.GetPrayerTimes(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          date
        },
        (error: grpc.ServiceError | null, response: any) => {
          if (error) {
            console.error('Prayer times service gRPC error:', error);
            reject(new Error(
              `Failed to fetch prayer times from gRPC service: ${error.details || error.message}`
            ));
            return;
          }

          try {
            // Map prayer names to PrayerName enum
            const prayerNameMap: Record<string, PrayerName> = {
              'Fajr': PrayerName.FAJR,
              'Dhuhr': PrayerName.DHUHR,
              'Asr': PrayerName.ASR,
              'Maghrib': PrayerName.MAGHRIB,
              'Isha': PrayerName.ISHA,
            };

            // Create PrayerTime objects for each prayer
            const prayerTimes = response.prayers.map((prayer: any) => {
              const prayerName = prayerNameMap[prayer.name];
              if (!prayerName) {
                throw new Error(`Unknown prayer name: ${prayer.name}`);
              }
              return PrayerTime.create(prayerName, prayer.time);
            });

            resolve(PrayerTimes.create(response.date, location, prayerTimes));
          } catch (parseError) {
            console.error('Error parsing prayer times response:', parseError);
            reject(new Error(
              `Failed to parse prayer times response: ${
                parseError instanceof Error ? parseError.message : 'Unknown error'
              }`
            ));
          }
        }
      );
    });
  }

  /**
   * Close the gRPC connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
    }
  }
}
