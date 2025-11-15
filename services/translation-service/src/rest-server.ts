import express, { Request, Response } from 'express';
import cors from 'cors';
import { getTranslation, getTranslations, getAllTranslations, Language, Translations } from './translations';

export function createRestServer(port: number = 3001) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'translation-service', protocol: 'REST' });
  });

  // Get single translation
  app.get('/translate/:language/:key', (req: Request, res: Response) => {
    const { language, key } = req.params;

    if (language !== 'en' && language !== 'ar') {
      return res.status(400).json({
        error: 'Invalid language. Supported languages: en, ar'
      });
    }

    try {
      const translation = getTranslation(key as keyof Translations, language as Language);
      res.json({
        key,
        language,
        translation
      });
    } catch (error) {
      res.status(500).json({
        error: 'Translation error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get multiple translations
  app.post('/translate/:language', (req: Request, res: Response) => {
    const { language } = req.params;
    const { keys } = req.body;

    if (language !== 'en' && language !== 'ar') {
      return res.status(400).json({
        error: 'Invalid language. Supported languages: en, ar'
      });
    }

    if (!Array.isArray(keys)) {
      return res.status(400).json({
        error: 'Invalid request. Expected { keys: string[] }'
      });
    }

    try {
      const translations = getTranslations(keys as (keyof Translations)[], language as Language);
      res.json({
        language,
        translations
      });
    } catch (error) {
      res.status(500).json({
        error: 'Translation error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all translations
  app.get('/translate/:language', (req: Request, res: Response) => {
    const { language } = req.params;

    if (language !== 'en' && language !== 'ar') {
      return res.status(400).json({
        error: 'Invalid language. Supported languages: en, ar'
      });
    }

    try {
      const translations = getAllTranslations(language as Language);
      res.json({
        language,
        translations
      });
    } catch (error) {
      res.status(500).json({
        error: 'Translation error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Start server
  app.listen(port, () => {
    console.log(`Translation Service (REST) running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });

  return app;
}
