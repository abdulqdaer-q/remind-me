import './style.css';
import { config } from './config';
import { parseQueryParams, telegramMiniApp } from './utils';
import { translationService, geocodingService } from './services';
import { prayerTimesTable } from './components/PrayerTimesTable';

// Log configuration for debugging
console.log('PRAYER_TIMES_SERVICE_URL', config.prayerTimesServiceUrl);
console.log('TRANSLATION_SERVICE_URL', config.translationServiceUrl);

class App {
  private appElement: HTMLDivElement | null = null;

  async init(): Promise<void> {
    // Initialize Telegram Mini App if running in Telegram
    telegramMiniApp.init();

    this.appElement = document.querySelector<HTMLDivElement>('#app');

    if (!this.appElement) {
      console.error('App element not found');
      return;
    }

    try {
      await this.render();
    } catch (error) {
      this.renderError(error);
    }
  }

  private async render(): Promise<void> {
    const { lat, lng, lang } = parseQueryParams();

    const [tableHtml, titleTemplate, cityName] = await Promise.all([
      prayerTimesTable.render(lat, lng, lang),
      translationService.translate('title_in', lang),
      geocodingService.getCityName(lat, lng),
    ]);

    const title = `${titleTemplate} ${cityName}`;

    if (this.appElement) {
      this.appElement.innerHTML = `
        <div class="header">
          <h1>${title}</h1>
        </div>
        ${tableHtml}
      `;
    }
  }

  private renderError(error: unknown): void {
    console.error('Error loading prayer times:', error);

    if (this.appElement) {
      this.appElement.innerHTML = `
        <h1>Error</h1>
        <p>Failed to load prayer times. Please try again later.</p>
      `;
    }
  }
}

// Initialize the app
const app = new App();
app.init();
