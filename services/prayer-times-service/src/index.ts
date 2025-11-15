import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { AladhanClient } from './aladhan-client';
import { createRestServer } from './rest-server';

const GRPC_PORT = process.env.GRPC_PORT || 50052;
const REST_PORT = process.env.REST_PORT || 3002;
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

// Create Aladhan client
const aladhanClient = new AladhanClient();

// Implement gRPC service methods
const prayerTimesService = {
  // Get prayer times
  GetPrayerTimes: async (call: any, callback: any) => {
    const { latitude, longitude, date } = call.request;

    // Validate latitude
    if (latitude < -90 || latitude > 90) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'Invalid latitude. Must be between -90 and 90'
      });
    }

    // Validate longitude
    if (longitude < -180 || longitude > 180) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'Invalid longitude. Must be between -180 and 180'
      });
    }

    // Validate date format if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    try {
      const prayerTimes = await aladhanClient.getPrayerTimes(latitude, longitude, date || undefined);

      callback(null, {
        date: prayerTimes.date,
        location: {
          latitude: prayerTimes.location.latitude,
          longitude: prayerTimes.location.longitude
        },
        prayers: prayerTimes.prayers.map(prayer => ({
          name: prayer.name,
          time: prayer.time,
          time12h: prayer.time12h
        }))
      });
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      callback({
        code: grpc.status.INTERNAL,
        details: error instanceof Error ? error.message : 'Failed to fetch prayer times'
      });
    }
  },

  // Health check
  HealthCheck: (call: any, callback: any) => {
    callback(null, {
      status: 'healthy',
      service: 'prayer-times-service'
    });
  }
};

// Create and start gRPC server
function startGrpcServer() {
  const server = new grpc.Server();

  server.addService(prayerTimesProto.PrayerTimesService.service, prayerTimesService);

  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error('Failed to start gRPC server:', error);
        process.exit(1);
      }
      console.log(`Prayer Times Service (gRPC) running on port ${port}`);
      console.log(`Protocol: gRPC`);
      console.log(`Proto file: ${PROTO_PATH}`);
    }
  );
}

// Start both servers
console.log('Starting Prayer Times Service with dual protocol support...');
startGrpcServer();
createRestServer(Number(REST_PORT));
