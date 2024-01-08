import { PrayerTimings } from "../api/prayer-times";

export function extractDateParts(date: Date) {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
  
    return {
        year,
        month,
        day
    }
}

export function convertTo12HourClock(timeStr: string) {
    const [hour, minute] = timeStr.split(':').map(Number);
    const meridiem = hour < 12 ? 'AM' : 'PM';
    const convertedHour = hour % 12 || 12;
    const resultStr = `${String(convertedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${meridiem}`;
    return resultStr;
}
export function getNextPrayerTime(prayerTimes: {[key: string]: string}) {
    const original = {...prayerTimes};
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes()}`
    const [currentHours, currentMinutes] = currentTime.split(':');
    const currentTimeInMinutes = parseInt(currentHours) * 60 + parseInt(currentMinutes);
    const prayerTimeArray = Object.entries(prayerTimes).map(([prayer, time]) => {
      const [hours, rest] = time.split(':');
      const [minutes, ks] = rest.split(' ');
      
      return {
        prayer,
        time:( parseInt(hours) + ((ks === 'PM' && hours !== '12') ? 12 : 0) ) * 60 + parseInt(minutes),
      };
    });
    console.log({prayerTimeArray});
    prayerTimeArray.sort((a, b) => a.time - b.time);
    let nextPrayerIndex = prayerTimeArray[0].prayer;
    for (const prayerTime of prayerTimeArray) {
      if (prayerTime.time > currentTimeInMinutes) {
        nextPrayerIndex = prayerTime.prayer;
        break;
      }
    }
    return Object.keys(original).findIndex(e => e === nextPrayerIndex);
  }