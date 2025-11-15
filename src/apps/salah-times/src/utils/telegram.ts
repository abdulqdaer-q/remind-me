/**
 * Telegram Mini App integration utilities
 */

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  colorScheme: 'light' | 'dark';
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    start_param?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export class TelegramMiniApp {
  private webApp: TelegramWebApp | null = null;
  private isTelegramEnvironment = false;

  constructor() {
    this.webApp = window.Telegram?.WebApp || null;
    this.isTelegramEnvironment = !!this.webApp;
  }

  /**
   * Initialize the Telegram Mini App
   */
  init(): void {
    if (!this.webApp) {
      console.log('Not running in Telegram environment');
      return;
    }

    // Notify Telegram that the app is ready
    this.webApp.ready();

    // Expand the app to full height
    this.webApp.expand();

    // Apply Telegram theme colors
    this.applyTheme();

    console.log('Telegram Mini App initialized');
  }

  /**
   * Check if running in Telegram environment
   */
  isTelegram(): boolean {
    return this.isTelegramEnvironment;
  }

  /**
   * Get the user's language from Telegram
   */
  getUserLanguage(): string | null {
    return this.webApp?.initDataUnsafe?.user?.language_code || null;
  }

  /**
   * Get the user's location from start parameter
   * Expected format: lat_lng (e.g., "33.5138_36.2765")
   */
  getLocationFromStartParam(): { lat: string; lng: string } | null {
    const startParam = this.webApp?.initDataUnsafe?.start_param;

    if (!startParam) {
      return null;
    }

    // Try to parse location from start parameter
    const parts = startParam.split('_');
    if (parts.length === 2) {
      return {
        lat: parts[0],
        lng: parts[1],
      };
    }

    return null;
  }

  /**
   * Apply Telegram theme to the app
   */
  applyTheme(): void {
    if (!this.webApp) return;

    const theme = this.webApp.themeParams;
    const root = document.documentElement;

    // Apply theme colors as CSS variables
    if (theme.bg_color) {
      root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
      document.body.style.backgroundColor = theme.bg_color;
    }

    if (theme.text_color) {
      root.style.setProperty('--tg-theme-text-color', theme.text_color);
    }

    if (theme.hint_color) {
      root.style.setProperty('--tg-theme-hint-color', theme.hint_color);
    }

    if (theme.link_color) {
      root.style.setProperty('--tg-theme-link-color', theme.link_color);
    }

    if (theme.button_color) {
      root.style.setProperty('--tg-theme-button-color', theme.button_color);
    }

    if (theme.button_text_color) {
      root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
    }

    if (theme.secondary_bg_color) {
      root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);
    }

    // Add color scheme class to body
    document.body.classList.add(`theme-${this.webApp.colorScheme}`);
  }

  /**
   * Close the Mini App
   */
  close(): void {
    if (this.webApp) {
      this.webApp.close();
    }
  }

  /**
   * Get the current viewport height
   */
  getViewportHeight(): number {
    return this.webApp?.viewportHeight || window.innerHeight;
  }

  /**
   * Get theme parameters
   */
  getThemeParams(): TelegramWebApp['themeParams'] {
    return this.webApp?.themeParams || {};
  }

  /**
   * Get color scheme
   */
  getColorScheme(): 'light' | 'dark' {
    return this.webApp?.colorScheme || 'light';
  }
}

export const telegramMiniApp = new TelegramMiniApp();
