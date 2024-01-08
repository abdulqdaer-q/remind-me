import Axios from "axios";
import { convertTo12HourClock, extractDateParts } from "../utils/date";

const axios = Axios.create({
  baseURL: "https://api.aladhan.com/v1",
});

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}
export interface DateInfo {
  gregorian: {
    date: string;
    day: string;
  };
}

export interface PrayerTimesResponse {
  data: [
    {
      timings: PrayerTimings;
      date: DateInfo;
    }
  ];
}

export class PrayerTimesService {
  async getByLatLng(lat: string, long: string) {
    const { day, month, year } = extractDateParts(new Date());
    const url = `/calendar/${year}/${month}?latitude=${lat}&longitude=${long}&method=4`;
    const { data } = await axios.get<PrayerTimesResponse>(url);
    const today = data.data.find((e) => e.date.gregorian.day === day);
    const properties = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const timings = Object.fromEntries(
      Object.entries(today?.timings!).map(([k, v]) => [
        k,
        convertTo12HourClock(v.split(" ")[0]),
      ]).filter(e => properties.includes(e[0]))
    );
    return timings;
  }
}

export const prayerTimeService = new PrayerTimesService();
