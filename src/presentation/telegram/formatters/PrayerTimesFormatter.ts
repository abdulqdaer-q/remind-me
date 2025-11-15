import { PrayerTimes } from '../../../domain/prayer/PrayerTimes';
import { Language } from '../../../domain/shared/Language';
import { GrpcTranslationService } from '../../../infrastructure/i18n/GrpcTranslationService';

/**
 * Prayer Times Formatter
 * Formats prayer times for display in Telegram
 */
export class PrayerTimesFormatter {
  constructor(private readonly translationService: GrpcTranslationService) {}

  async formatForMessage(prayerTimes: PrayerTimes, language: Language): Promise<string> {
    const title = await this.translationService.translate('prayer-times-title', language);
    const nextPrayer = prayerTimes.getNextPrayer();

    let message = `📿 *${title}* 📿\n\n`;

    for (const prayerTime of prayerTimes.getAllPrayerTimes()) {
      const prayerNameKey = prayerTime.name.toLowerCase() as any;
      const translatedName = await this.translationService.translate(prayerNameKey, language);
      const isNext = nextPrayer && nextPrayer.name === prayerTime.name;

      message += isNext
        ? `▶️ *${translatedName}*: ${prayerTime.time12}\n`
        : `   ${translatedName}: ${prayerTime.time12}\n`;
    }

    if (nextPrayer) {
      const nextPrayerText = await this.translationService.translate('next-prayer', language);
      const nextPrayerName = await this.translationService.translate(
        nextPrayer.name.toLowerCase() as any,
        language
      );
      message += `\n🔔 *${nextPrayerText}*: ${nextPrayerName} at ${nextPrayer.time12}`;
    }

    return message;
  }

  /**
   * Generates the mini app URL with location and language parameters
   */
  generateMiniAppUrl(
    baseUrl: string,
    latitude: number,
    longitude: number,
    language: Language
  ): string {
    return `${baseUrl}?lat=${latitude}&lng=${longitude}&lang=${language.code}`;
  }
}
