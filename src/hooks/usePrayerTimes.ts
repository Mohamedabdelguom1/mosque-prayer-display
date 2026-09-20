import { useEffect, useMemo, useRef, useState } from 'react';
import type { DayTimings, ScheduleState, Settings } from '../types';
import { cacheKey, fetchMonth, pruneOldMonths, readCache, type MonthKey } from '../lib/aladhan';
import { computeSchedule } from '../lib/schedule';
import { localDateKey } from '../lib/format';

/** تراجع اسّي عند فشل الشبكة */
const RETRY_DELAYS_MS = [60_000, 120_000, 300_000, 900_000];

/** البيانات تُعدّ قديمة بعد ثلاثة ايام بلا تحديث ناجح */
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * حد التنبيه على انحراف ساعة الجهاز.
 * خمس دقائق تكفي لازاحة وقت الصلاة ازاحة ملحوظة، وهي اكبر بكثير
 * من اي تأخير شبكة معقول فلا تسبب انذارات كاذبة.
 */
const CLOCK_SKEW_LIMIT_MS = 5 * 60_000;

export interface PrayerTimesState {
  schedule: ScheduleState | null;
  today: DayTimings | null;
  /** لا بيانات اطلاقا — اول تشغيل بلا انترنت */
  empty: boolean;
  /** آخر تحديث ناجح تجاوز عمره ثلاثة ايام */
  stale: boolean;
  lastFetchedAt: number | null;
  error: string | null;
  /** ساعة الجهاز تخالف ساعة الخادم بفارق يفسد المواقيت */
  clockWrong: boolean;
  /** فرق ساعة الجهاز عن الخادم بالملي ثانية، موجب اذا كان متقدّما */
  clockSkewMs: number | null;
}

/** يبني تاريخا من مفتاح اليوم YYYY-MM-DD عند منتصف النهار المحلي */
function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function addMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export function usePrayerTimes(now: Date, settings: Settings): PrayerTimesState {
  const [days, setDays] = useState<Record<string, DayTimings>>({});
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clockSkewMs, setClockSkewMs] = useState<number | null>(null);

  const timerRef = useRef(0);

  const dayKey = localDateKey(now);
  const { latitude, longitude, method, school } = settings;

  /*
   * الجلب يعتمد على قيم اولية فقط: اليوم والموقع وطريقة الحساب.
   * لا نمرّر now ولا كائن الاعدادات كاملا، لان now يتغيّر كل ثانية
   * وكائن الاعدادات تتبدّل هويته مع اي تعديل، فتُعاد الدورة بلا داع.
   */
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const refDate = dateFromKey(dayKey);
    const current: MonthKey = {
      year: refDate.getFullYear(),
      month: refDate.getMonth() + 1,
      latitude,
      longitude,
      method,
      school,
    };
    const nextMonthDate = addMonth(refDate);
    const upcoming: MonthKey = {
      ...current,
      year: nextMonthDate.getFullYear(),
      month: nextMonthDate.getMonth() + 1,
    };

    let attempt = 0;

    const load = async () => {
      // 1) اعرض الكاش فورا — لا شاشة تحميل ان وُجد
      const cachedCurrent = readCache(current);
      const cachedNext = readCache(upcoming);
      if (cachedCurrent || cachedNext) {
        setDays({ ...(cachedNext?.days ?? {}), ...(cachedCurrent?.days ?? {}) });
        setLastFetchedAt(cachedCurrent?.fetchedAt ?? cachedNext?.fetchedAt ?? null);
      }

      // 2) حدّث من الشبكة في الخلفية
      try {
        const fresh = await fetchMonth(current, signal);
        if (signal.aborted) return;

        setDays((prev) => ({ ...prev, ...fresh.days }));
        setLastFetchedAt(fresh.fetchedAt);
        setClockSkewMs(fresh.clockSkewMs);
        setError(null);
        attempt = 0;

        // 3) الشهر التالي مسبقا اذا اقترب انتهاء الحالي
        const lastDay = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
        if (lastDay - refDate.getDate() <= 5) {
          const next = await fetchMonth(upcoming, signal);
          if (signal.aborted) return;
          setDays((prev) => ({ ...next.days, ...prev }));
        }

        pruneOldMonths([cacheKey(current), cacheKey(upcoming)]);
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : 'network error');

        // 4) اعادة المحاولة بتراجع اسّي
        const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
        attempt += 1;
        timerRef.current = window.setTimeout(() => {
          if (!signal.aborted) void load();
        }, delay);
      }
    };

    void load();

    return () => {
      controller.abort();
      window.clearTimeout(timerRef.current);
    };
  }, [dayKey, latitude, longitude, method, school]);

  const schedule = useMemo(
    () => computeSchedule(now, days, settings),
    [now, days, settings],
  );

  const today = days[dayKey] ?? null;
  const empty = Object.keys(days).length === 0;

  /*
   * نقيس قدم البيانات بساعة التطبيق الممرّرة لا بـ Date.now،
   * فاستدعاء دالة غير خالصة اثناء الرسم يعطي نتائج غير مستقرة،
   * وساعة التطبيق تحترم وضع الاختبار ?mock ايضا.
   */
  const stale = lastFetchedAt !== null && now.getTime() - lastFetchedAt > STALE_AFTER_MS;

  const clockWrong = clockSkewMs !== null && Math.abs(clockSkewMs) > CLOCK_SKEW_LIMIT_MS;

  return { schedule, today, empty, stale, lastFetchedAt, error, clockWrong, clockSkewMs };
}
