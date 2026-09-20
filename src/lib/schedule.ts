import type {
  AdhanPrayerKey,
  DayTimings,
  PrayerKey,
  PrayerSlot,
  ScheduleState,
  Settings,
} from '../types';
import { PRAYER_NAMES, PRAYER_ORDER } from '../config/defaults';
import { localDateKey } from './format';

/** الشروق ليس صلاة: لا اذان له ولا اقامة */
export const isPrayerKey = (key: PrayerKey): key is AdhanPrayerKey => key !== 'Sunrise';

/** يبني تاريخا فعليا من تاريخ اليوم وعدد الدقائق منذ منتصف الليل */
function atMinutes(dayStart: Date, minutes: number): Date {
  const d = new Date(dayStart);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

/** يحوّل مواقيت يوم الى قائمة مواعيد فعلية مع الاقامة والتعديلات */
export function buildSlots(
  timings: DayTimings,
  dayStart: Date,
  settings: Settings,
): PrayerSlot[] {
  return PRAYER_ORDER.map((key) => {
    const at = atMinutes(dayStart, timings.minutes[key] + settings.offsets[key]);
    const slot: PrayerSlot = {
      key,
      nameAr: PRAYER_NAMES[key],
      at,
      isPrayer: isPrayerKey(key),
    };
    if (isPrayerKey(key)) {
      slot.iqamaAt = new Date(at.getTime() + settings.iqamaGaps[key] * 60_000);
    }
    return slot;
  });
}

/** اليوم التالي لتاريخ معطى */
function nextDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * يحسب حالة الجدول للحظة الحالية.
 *
 * ملاحظة مهمة: بعد دخول العشاء يصبح الوقت القادم هو فجر الغد،
 * فيُقرأ من تقويم الشهر المخزّن ولا يُسقط على اليوم الحالي.
 */
export function computeSchedule(
  now: Date,
  days: Record<string, DayTimings>,
  settings: Settings,
): ScheduleState | null {
  const todayTimings = days[localDateKey(now)];
  if (!todayTimings) return null;

  const todaySlots = buildSlots(todayTimings, now, settings);

  // اول موعد لم يأتِ بعد من مواعيد اليوم
  const upcoming = todaySlots.find((slot) => slot.at.getTime() > now.getTime());

  if (upcoming) {
    const entered = todaySlots.filter((slot) => slot.at.getTime() <= now.getTime());
    return {
      today: todaySlots,
      todayActual: todaySlots,
      next: upcoming,
      current: entered.length > 0 ? entered[entered.length - 1] : null,
      isNextDay: false,
      msUntilNext: upcoming.at.getTime() - now.getTime(),
    };
  }

  /*
   * مضى العشاء. اللوحة تنتقل كلها الى مواقيت الغد،
   * لانها ما دامت تعدّ تنازليا لفجر الغد فيجب ان تعرض وقت فجر الغد نفسه
   * لا وقت فجر اليوم الذي انقضى.
   */
  const tomorrow = nextDay(now);
  const tomorrowTimings = days[localDateKey(tomorrow)] ?? todayTimings;
  const tomorrowSlots = buildSlots(tomorrowTimings, tomorrow, settings);

  return {
    today: tomorrowSlots,
    todayActual: todaySlots,
    next: tomorrowSlots[0],
    current: todaySlots[todaySlots.length - 1],
    isNextDay: true,
    msUntilNext: tomorrowSlots[0].at.getTime() - now.getTime(),
  };
}

/** الايام المتبقية على رمضان اعتمادا على التاريخ الهجري لليوم */
export function daysUntilRamadan(timings: DayTimings): number | null {
  const { day, month } = timings.hijri;
  if (month === 9) return 0; // نحن في رمضان

  // تقدير بطول شهر هجري 29.5 يوما
  const monthsAhead = month < 9 ? 9 - month : 9 + (12 - month);
  const daysLeftInThisMonth = 29.5 - day;
  const estimate = Math.round(daysLeftInThisMonth + (monthsAhead - 1) * 29.5);
  return Math.max(0, estimate);
}
