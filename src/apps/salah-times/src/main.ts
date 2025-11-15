import './style.css';

// ===== Configuration =====
const PRAYER_TIMES_SERVICE_URL = import.meta.env.VITE_PRAYER_TIMES_SERVICE_URL || 'http://localhost:3002';
const TRANSLATION_SERVICE_URL = import.meta.env.VITE_TRANSLATION_SERVICE_URL || 'http://localhost:3001';

// ===== Types =====
interface Prayer {
  name: string;
  time: string;
  time12h: string;
}

interface PrayerTimesResponse {
  date: string;
  location: {
    latitude: number;
    longitude: number;
  };
  prayers: Prayer[];
}

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface QueryParams {
  lat: string;
  lng: string;
  lang: string;
}

// ===== Translations =====
const translationCache: Record<string, Record<string, string>> = {};

const translate = async (key: string, lang: string): Promise<string> => {
  // Check cache first
  if (translationCache[lang]?.[key]) {
    return translationCache[lang][key];
  }

  try {
    const response = await fetch(`${TRANSLATION_SERVICE_URL}/translate/${lang}/${key}`);
    const data = await response.json();

    // Cache the translation
    if (!translationCache[lang]) {
      translationCache[lang] = {};
    }
    translationCache[lang][key] = data.translation;

    return data.translation;
  } catch (error) {
    console.error(`Translation error for key "${key}":`, error);
    // Fallback translations
    const fallback: Record<string, Record<string, string>> = {
      en: {
        title: 'Prayer Times',
        fajr: 'Fajr',
        sunrise: 'Sunrise',
        dhuhr: 'Dhuhr',
        asr: 'Asr',
        maghrib: 'Maghrib',
        isha: 'Isha',
      },
      ar: {
        title: 'أوقات الصلاة',
        fajr: 'الفجر',
        sunrise: 'الشروق',
        dhuhr: 'الظهر',
        asr: 'العصر',
        maghrib: 'المغرب',
        isha: 'العشاء',
      },
    };
    return fallback[lang]?.[key] || fallback.en[key] || key;
  }
};

// ===== Prayer Times API =====
const fetchPrayerTimes = async (
  lat: string,
  lng: string
): Promise<PrayerTimings> => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  const url = `${PRAYER_TIMES_SERVICE_URL}/prayer-times?lat=${lat}&lng=${lng}&date=${date}`;

  const response = await fetch(url);
  const data: PrayerTimesResponse = await response.json();

  // Convert the response to PrayerTimings format
  const timings: PrayerTimings = {
    Fajr: '',
    Sunrise: '',
    Dhuhr: '',
    Asr: '',
    Maghrib: '',
    Isha: '',
  };

  data.prayers.forEach((prayer) => {
    const prayerName = prayer.name as keyof PrayerTimings;
    timings[prayerName] = prayer.time;
  });

  return timings;
};

// ===== Utility Functions =====
const getNextPrayerIndex = (times: PrayerTimings): number => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const prayerMinutes = prayerNames.map((name) => {
    const [hours, minutes] = times[name as keyof PrayerTimings].split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  });

  for (let i = 0; i < prayerMinutes.length; i++) {
    if (currentTime < prayerMinutes[i]) {
      return i;
    }
  }

  // If all prayers have passed, next is Fajr tomorrow
  return 0;
};

const parseQueryParams = (): QueryParams => {
  const query = window.location.search
    .replace('?', '')
    .split('&')
    .reduce((p, c) => {
      const [key, value] = c.split('=');
      return { ...p, [key]: value };
    }, {} as Record<string, string>);

  return {
    lat: query.lat || '33.5138',
    lng: query.lng || '36.2765',
    lang: query.lang || 'en',
  };
};

// ===== Render Functions =====
const renderPrayerTimesTable = async (
  lat: string,
  lng: string,
  lang: string
): Promise<string> => {
  const times = await fetchPrayerTimes(lat, lng);
  const nextPrayerIdx = getNextPrayerIndex(times);

  const prayerNames = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerKeys: (keyof PrayerTimings)[] = [
    'Fajr',
    'Sunrise',
    'Dhuhr',
    'Asr',
    'Maghrib',
    'Isha',
  ];

  const isRtl = lang === 'ar';

  // Fetch all translations asynchronously
  const translatedNames = await Promise.all(
    prayerNames.map(name => translate(name, lang))
  );

  return `
  <table dir="${isRtl ? 'rtl' : 'ltr'}">
    <tr>
      ${translatedNames
        .map(
          (translatedName, idx) => `
        <td class="${idx === nextPrayerIdx ? 'active' : ''}">
          ${translatedName}
        </td>
      `
        )
        .join('')}
    </tr>
    <tr>
      ${prayerKeys
        .map(
          (key, idx) => `
        <td class="${idx === nextPrayerIdx ? 'active' : ''}">
          ${times[key]}
        </td>
      `
        )
        .join('')}
    </tr>
  </table>
  `;
};

// ===== Main App =====
const initApp = async () => {
  const { lat, lng, lang } = parseQueryParams();

  try {
    const [tableHtml, title] = await Promise.all([
      renderPrayerTimesTable(lat, lng, lang),
      translate('title', lang)
    ]);

    const appElement = document.querySelector<HTMLDivElement>('#app');

    if (appElement) {
      appElement.innerHTML = `
        <h1>${title}</h1>
        ${tableHtml}
      `;
    }
  } catch (error) {
    console.error('Error loading prayer times:', error);
    const appElement = document.querySelector<HTMLDivElement>('#app');
    if (appElement) {
      appElement.innerHTML = `
        <h1>Error</h1>
        <p>Failed to load prayer times. Please try again later.</p>
      `;
    }
  }
};

// Start the app
initApp();
