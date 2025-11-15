import './style.css';

// ===== Types =====
interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface AladhanResponse {
  data: Array<{
    timings: PrayerTimings;
    date: {
      gregorian: {
        date: string;
        day: string;
      };
    };
  }>;
}

interface QueryParams {
  lat: string;
  lng: string;
  lang: string;
}

// ===== Translations =====
const translations: Record<string, Record<string, string>> = {
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

const translate = (key: string, lang: string): string => {
  return translations[lang]?.[key] || translations.en[key] || key;
};

// ===== Prayer Times API =====
const fetchPrayerTimes = async (
  lat: string,
  lng: string
): Promise<PrayerTimings> => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=4`;

  const response = await fetch(url);
  const data: AladhanResponse = await response.json();

  // Find today's data
  const dayData = data.data.find((e) => e.date.gregorian.day === String(day));

  if (!dayData) {
    throw new Error('Prayer times not found for today');
  }

  // Clean time strings (remove timezone info)
  const cleanTime = (time: string) => time.split(' ')[0];

  return {
    Fajr: cleanTime(dayData.timings.Fajr),
    Sunrise: cleanTime(dayData.timings.Sunrise),
    Dhuhr: cleanTime(dayData.timings.Dhuhr),
    Asr: cleanTime(dayData.timings.Asr),
    Maghrib: cleanTime(dayData.timings.Maghrib),
    Isha: cleanTime(dayData.timings.Isha),
  };
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

  return `
  <table dir="${isRtl ? 'rtl' : 'ltr'}">
    <tr>
      ${prayerNames
        .map(
          (name, idx) => `
        <td class="${idx === nextPrayerIdx ? 'active' : ''}">
          ${translate(name, lang)}
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
    const tableHtml = await renderPrayerTimesTable(lat, lng, lang);
    const appElement = document.querySelector<HTMLDivElement>('#app');

    if (appElement) {
      appElement.innerHTML = `
        <h1>${translate('title', lang)}</h1>
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
