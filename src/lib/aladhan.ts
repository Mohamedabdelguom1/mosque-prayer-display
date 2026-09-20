import type { DayTimings, PrayerKey } from '../types';
import { PRAYER_ORDER } from '../config/defaults';

/**
 * جلب تقويم الشهر من Aladhan مع تخزين مؤقت في localStorage.
 *
 * طلب واحد يعطي الشهر كاملا مع التاريخ الهجري لكل يوم،
 * فلا حاجة لاي طلب اضافي ولا لاتصال دائم.
 */

const BASE = 'https://api.aladhan.com/v1/calendar';

export interface MonthKey {
  year: number;
  month: number; // 1-12
  latitude: number;
  longitude: number;
  method: number;
  school: 0 | 1;
}

export interface CachedMonth {
  fetchedAt: number;
  days: Record<string, DayTimings>; // مفتاحه YYYY-MM-DD
}

function cacheKey(k: MonthKey): string {
  const mm = String(k.month).padStart(2, '0');
  return `mosque-display:prayers:${k.latitude.toFixed(4)}:${k.longitude.toFixed(
    4,
  )}:${k.method}:${k.school}:${k.year}-${mm}`;
}

/** يحوّل "05:08 (+03)" الى 308 دقيقة */
function parseMinutes(raw: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(raw.trim());
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** يحوّل "28-01-2025" الى "2025-01-28" */
function normalizeGregorian(raw: string): string {
  const [d, m, y] = raw.split('-');
  return `${y}-${m}-${d}`;
}

interface AladhanDay {
  timings: Record<string, string>;
  date: {
    gregorian: { date: string };
    hijri: {
      day: string;
      month: { number: number; ar: string };
      year: string;
      weekday: { ar: string };
    };
  };
}

function toDayTimings(day: AladhanDay): DayTimings {
  const minutes = {} as Record<PrayerKey, number>;
  for (const key of PRAYER_ORDER) {
    minutes[key] = parseMinutes(day.timings[key] ?? '00:00');
  }
  return {
    gregorian: normalizeGregorian(day.date.gregorian.date),
    hijri: {
      day: Number(day.date.hijri.day),
      month: day.date.hijri.month.number,
      year: Number(day.date.hijri.year),
      monthNameAr: day.date.hijri.month.ar,
      weekdayAr: day.date.hijri.weekday.ar,
    },
    minutes,
  };
}

export function readCache(k: MonthKey): CachedMonth | null {
  try {
    const raw = localStorage.getItem(cacheKey(k));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedMonth;
    if (!parsed?.days || typeof parsed.fetchedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(k: MonthKey, value: CachedMonth): void {
  try {
    localStorage.setItem(cacheKey(k), JSON.stringify(value));
  } catch {
    // الحصة ممتلئة — نتجاهل، الذاكرة الحيّة ما زالت تعمل
  }
}

/** يجلب شهرا من الشبكة ويحفظه في الكاش */
export async function fetchMonth(k: MonthKey, signal?: AbortSignal): Promise<CachedMonth> {
  const url =
    `${BASE}/${k.year}/${k.month}` +
    `?latitude=${k.latitude}&longitude=${k.longitude}` +
    `&method=${k.method}&school=${k.school}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Aladhan HTTP ${res.status}`);

  const json = (await res.json()) as { code: number; data: AladhanDay[] };
  if (json.code !== 200 || !Array.isArray(json.data)) {
    throw new Error('Aladhan returned an unexpected payload');
  }

  const days: Record<string, DayTimings> = {};
  for (const day of json.data) {
    const parsed = toDayTimings(day);
    days[parsed.gregorian] = parsed;
  }

  const cached: CachedMonth = { fetchedAt: Date.now(), days };
  writeCache(k, cached);
  return cached;
}

/** ينظّف الاشهر القديمة حتى لا تتضخم مساحة التخزين */
export function pruneOldMonths(keepPrefixes: string[]): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('mosque-display:prayers:')) continue;
      if (!keepPrefixes.some((p) => key === p)) toRemove.push(key);
    }
    toRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // تجاهل
  }
}

export { cacheKey };
