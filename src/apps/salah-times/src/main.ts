import './style.css'
import {Translations, translate} from '../../../../../translations/index';
import {PrayerTimings, prayerTimeService} from '../../../../../core/api/prayer-times';
import { getNextPrayerTime } from '../../../../../core/utils/date';
const getSalahs = async (lat: string, lng: string, lang = 'en') => {
  const todayTimes = await prayerTimeService.getByLatLng(lat, lng)
  const nextPrayer = getNextPrayerTime(todayTimes);
  const salahsKeys = Object.keys(todayTimes!);
//  const titles = await Promise.all(salahsKeys.map(async (e) => await translate(e.toLowerCase() as keyof Translations, lang)));

  return {titles: salahsKeys, values: Object.values(todayTimes!), nextPrayer};
};



const renederSalahsTable = async () => {
  const query = window.location.search.replace('?','').split('&').reduce((p, c) => ({
    ...p,
    [c.split('=')[0]]: c.split('=')[1]
  }), {lat: '', lng:'', lang: ''},);
  const {
    titles, values, nextPrayer
  } = await getSalahs(query.lat, query.lng, query.lang);
  return `
  <table dir="${query.lang === 'ar' ? 'rtl': 'ltr'}">
    <tr>
          ${titles.map((v, idx) => `
              <td class="${idx === nextPrayer ? 'active' : ''}">
              ${v}
              </td>
          `)}
    </tr>
    <tr>
          ${values.map((v, idx) => `
              <td class="${idx === nextPrayer ? 'active' : ''}">
              ${v}
              </td>
          `)}
    </tr>
  </table>
      `
} 


renederSalahsTable().then(ke => {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <h1>Prayer Times</h1>
      ${ke}      
`

})

