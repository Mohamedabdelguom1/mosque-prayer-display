import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DayTimings, ScheduleState, Settings } from '../types';
import {
  cacheKey,
  fetchMonth,
  pruneOldMonths,
  type MonthKey,
} from '../lib/aladhan';
import { computeSchedule } from '../lib/schedule';
import { readCache } from '../lib/aladhan';
import { localDateKey } from '../lib/format';

/** تراجع اسّي عند فشل الشبكة */
const RETRY_DELAYS_MS = [60_000, 120_000, 300_000, 900_000];

/** البيانات تُعدّ قديمة بعد ثلاثة ايام بلا تحديث ناجح */
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

function monthKeyFor(date: Date, s: Settings): MonthKey {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    latitude: s.latitude,
    longitude: s.longitude,
    method: s.method,
    school: s.school,
  };
}

function addMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export interface PrayerTimesState {
  schedule: ScheduleState | null;
  today: DayTimings | null;
  /** لا بيانات اطلاقا — اول تشغيل بلا انترنت */
  empty: boolean;
  /** آخر تحديث ناجح تجاوز عمره ثلاثة ايام */
  stale: boolean;
  lastFetchedAt: number | null;
  error: string | null;
}

export function usePrayerTimes(now: Date, settings: Settings): PrayerTimesState {
  const [days, setDays] = useState<Record<string, DayTimings>>({});
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const retryIndex = useRef(0);
  const timerRef = useRef(0);

  // نُعيد الجلب عند تغيّر الموقع أو طريقة الحساب أو اليوم
  const dayKey = localDateKey(now);
  const locationKey = `${settings.latitude}:${settings.longitude}:${settings.method}:${settings.school}`;

  const load = useCallback(
    async (signal: AbortSignal) => {
      const current = monthKeyFor(now, settings);
      const upcoming = monthKeyFor(addMonth(now), settings);

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
        setError(null);
        retryIndex.current = 0;

        // 3) الشهر التالي مسبقا اذا اقترب انتهاء الحالي
        const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
        if (daysLeft <= 5) {
          const next = await fetchMonth(upcoming, signal);
          if (signal.aborted) return;
          setDays((prev) => ({ ...next.days, ...prev }));
        }

        pruneOldMonths([cacheKey(current), cacheKey(upcoming)]);
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : 'network error');

        // 4) اعادة المحاولة بتراجع اسّي
        const delay = RETRY_DELAYS_MS[Math.min(retryIndex.current, RETRY_DELAYS_MS.length - 1)];
        retryIndex.current += 1;
        timerRef.current = window.setTimeout(() => {
          if (!signal.aborted) void load(signal);
        }, delay);
      }
    },
    // now يتغيّر كل ثانية، لكننا نعتمد على dayKey فقط لاعادة التشغيل
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, locationKey],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => {
      controller.abort();
      window.clearTimeout(timerRef.current);
    };
  }, [load]);

  const schedule = useMemo(
    () => computeSchedule(now, days, settings),
    [now, days, settings],
  );

  const today = days[dayKey] ?? null;
  const empty = Object.keys(days).length === 0;
  const stale =
    lastFetchedAt !== null && Date.now() - lastFetchedAt > STALE_AFTER_MS;

  return { schedule, today, empty, stale, lastFetchedAt, error };
}
