import { prayerTimesService } from '../services/PrayerTimesService';
import { translationService } from '../services/TranslationService';
import { getNextPrayerIndex, isRtlLanguage } from '../utils';
import { PRAYER_KEYS, PRAYER_NAMES } from '../types';
import type { PrayerTimings } from '../types';

export class PrayerTimesTable {
  async render(lat: string, lng: string, lang: string): Promise<string> {
    try {
      const times = await prayerTimesService.fetchPrayerTimes(lat, lng);
      const nextPrayerIdx = getNextPrayerIndex(times);
      const isRtl = isRtlLanguage(lang);

      // Fetch all translations in parallel
      const translatedNames = await translationService.translateBatch(
        [...PRAYER_KEYS],
        lang
      );

      return this.buildTableHTML(times, translatedNames, nextPrayerIdx, isRtl);
    } catch (error) {
      console.error('Error rendering prayer times table:', error);
      throw error;
    }
  }

  private buildTableHTML(
    times: PrayerTimings,
    translatedNames: string[],
    nextPrayerIdx: number,
    isRtl: boolean
  ): string {
    const headerRow = this.buildHeaderRow(translatedNames, nextPrayerIdx);
    const timesRow = this.buildTimesRow(times, translatedNames, nextPrayerIdx);

    return `
      <table dir="${isRtl ? 'rtl' : 'ltr'}">
        ${headerRow}
        ${timesRow}
      </table>
    `;
  }

  private buildHeaderRow(translatedNames: string[], nextPrayerIdx: number): string {
    const cells = translatedNames
      .map(
        (name, idx) => `
          <td class="${idx === nextPrayerIdx ? 'active' : ''}">
            ${name}
          </td>
        `
      )
      .join('');

    return `<tr>${cells}</tr>`;
  }

  private buildTimesRow(times: PrayerTimings, translatedNames: string[], nextPrayerIdx: number): string {
    const cells = PRAYER_NAMES.map(
      (name, idx) => `
        <td class="${idx === nextPrayerIdx ? 'active' : ''}" data-prayer="${translatedNames[idx]}">
          <span class="prayer-name">${translatedNames[idx]}</span>
          <span class="prayer-time">${times[name]}</span>
        </td>
      `
    ).join('');

    return `<tr>${cells}</tr>`;
  }
}

export const prayerTimesTable = new PrayerTimesTable();
