import express, { Request, Response } from 'express';
import cors from 'cors';
import { AladhanClient } from './aladhan-client';

export function createRestServer(port: number = 3002) {
  const app = express();
  const aladhanClient = new AladhanClient();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'prayer-times-service', protocol: 'REST' });
  });

  // Get prayer times
  app.get('/prayer-times', async (req: Request, res: Response) => {
    try {
      const { lat, lng, date } = req.query;

      // Validate latitude
      if (!lat || typeof lat !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid latitude parameter'
        });
      }

      // Validate longitude
      if (!lng || typeof lng !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid longitude parameter'
        });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      // Validate coordinate ranges
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        return res.status(400).json({
          error: 'Invalid latitude. Must be between -90 and 90'
        });
      }

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          error: 'Invalid longitude. Must be between -180 and 180'
        });
      }

      // Validate date format if provided
      const dateParam = date as string | undefined;
      if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const prayerTimes = await aladhanClient.getPrayerTimes(latitude, longitude, dateParam);
      res.json(prayerTimes);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      res.status(500).json({
        error: 'Failed to fetch prayer times',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Start server
  app.listen(port, () => {
    console.log(`Prayer Times Service (REST) running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });

  return app;
}
