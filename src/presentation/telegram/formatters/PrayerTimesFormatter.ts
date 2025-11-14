import { PrayerTimes } from '../../../domain/prayer/PrayerTimes';
import { Language } from '../../../domain/shared/Language';
import { TranslationService } from '../../../infrastructure/i18n/TranslationService';

/**
 * Prayer Times Formatter
 * Formats prayer times for display in Telegram
 */
export class PrayerTimesFormatter {
  constructor(private readonly translationService: TranslationService) {}

  formatForMessage(prayerTimes: PrayerTimes, language: Language): string {
    const title = this.translationService.translate('prayer-times-title', language);
    const nextPrayer = prayerTimes.getNextPrayer();

    let message = `📿 *${title}* 📿\n\n`;

    for (const prayerTime of prayerTimes.getAllPrayerTimes()) {
      const prayerNameKey = prayerTime.name.toLowerCase() as any;
      const translatedName = this.translationService.translate(prayerNameKey, language);
      const isNext = nextPrayer && nextPrayer.name === prayerTime.name;

      message += isNext
        ? `▶️ *${translatedName}*: ${prayerTime.time12}\n`
        : `   ${translatedName}: ${prayerTime.time12}\n`;
    }

    if (nextPrayer) {
      const nextPrayerText = this.translationService.translate('next-prayer', language);
      const nextPrayerName = this.translationService.translate(
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
