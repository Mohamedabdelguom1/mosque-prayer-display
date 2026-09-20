import type { DayTimings, Settings } from '../types';
import { DEFAULT_SETTINGS } from '../config/defaults';

/**
 * مواقيت ثابتة لاختبارات الجدول.
 * القيم دقائق منذ منتصف الليل، وهي قريبة من مواقيت الرياض في سبتمبر.
 */
export const DAY_1: DayTimings = {
  gregorian: '2026-09-20',
  hijri: { day: 9, month: 4, year: 1448, monthNameAr: 'ربيع الآخر', weekdayAr: 'الأحد' },
  minutes: {
    Fajr: 263,      // 04:23
    Sunrise: 341,   // 05:41
    Dhuhr: 706,     // 11:46
    Asr: 915,       // 15:15
    Maghrib: 1071,  // 17:51
    Isha: 1101,     // 18:21
  },
};

/** اليوم التالي، بفارق دقيقة عن اليوم السابق ليتضح اي يوم استُخدم */
export const DAY_2: DayTimings = {
  gregorian: '2026-09-21',
  hijri: { day: 10, month: 4, year: 1448, monthNameAr: 'ربيع الآخر', weekdayAr: 'الإثنين' },
  minutes: {
    Fajr: 264,      // 04:24
    Sunrise: 342,
    Dhuhr: 705,
    Asr: 914,
    Maghrib: 1069,
    Isha: 1099,
  },
};

export const DAYS: Record<string, DayTimings> = {
  '2026-09-20': DAY_1,
  '2026-09-21': DAY_2,
};

/** لحظة في اليوم الاول بالتوقيت المحلي */
export const at = (h: number, m: number, s = 0) => new Date(2026, 8, 20, h, m, s, 0);

export const SETTINGS: Settings = {
  ...DEFAULT_SETTINGS,
  offsets: { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 },
  iqamaGaps: { Fajr: 20, Dhuhr: 15, Asr: 15, Maghrib: 7, Isha: 12 },
  adhanScreenSeconds: 180,
  silenceMinutes: 8,
};
