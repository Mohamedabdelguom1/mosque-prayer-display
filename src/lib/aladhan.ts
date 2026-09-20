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

export interface FetchedMonth extends CachedMonth {
  /**
   * فرق ساعة الجهاز عن ساعة الخادم بالملي ثانية، موجب اذا كان الجهاز متقدّما.
   * null اذا لم يرسل الخادم ترويسة Date.
   *
   * هذا هو المرجع الوحيد المستقل عن الجهاز: كل مواقيت الشاشة مبنية على
   * ساعته المحلية، وجهاز بلا وحدة RTC يفقد ساعته عند انقطاع الكهرباء
   * فيعرض مواقيت خاطئة بثقة تامة ما لم نكشف الانحراف.
   */
  clockSkewMs: number | null;
}

function cacheKey(k: MonthKey): string {
  const mm = String(k.month).padStart(2, '0');
  return `mosque-display:prayers:${k.latitude.toFixed(4)}:${k.longitude.toFixed(
    4,
  )}:${k.method}:${k.school}:${k.year}-${mm}`;
}

/**
 * يقيس فرق ساعة الجهاز عن الخادم من ترويسة Date.
 *
 * يرجع null اذا كان الرد قد يكون محفوظا في وسيط: ترويسة Age تعني
 * ان نسخة مخزّنة قُدّمت، وتاريخها لحظة توليدها لا لحظة وصولها،
 * فقياسها يعطي انحرافا وهميا بقدر عمر النسخة.
 */
function measureSkew(res: Response, deviceNow: number): number | null {
  const headers = res.headers;
  if (!headers?.get) return null;

  const age = Number(headers.get('age'));
  if (Number.isFinite(age) && age > 0) return null;

  const serverDate = headers.get('date');
  if (!serverDate) return null;

  const serverMs = Date.parse(serverDate);
  return Number.isFinite(serverMs) ? deviceNow - serverMs : null;
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
export async function fetchMonth(k: MonthKey, signal?: AbortSignal): Promise<FetchedMonth> {
  const url =
    `${BASE}/${k.year}/${k.month}` +
    `?latitude=${k.latitude}&longitude=${k.longitude}` +
    `&method=${k.method}&school=${k.school}`;

  /*
   * no-store مقصود: الخادم يرسل Cache-Control: max-age=3600، فلولا ذلك
   * لأعاد المتصفح ردا محفوظا بترويسة Date قديمة، فنقيس عمر الكاش
   * ونحسبه انحرافا في ساعة الجهاز وننبّه بلا سبب.
   * ولا نخسر شيئا بتعطيله، فلدينا كاشنا الخاص في localStorage.
   */
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Aladhan HTTP ${res.status}`);

  // نقيس الانحراف فور وصول الرد، قبل اي معالجة قد تستغرق وقتا
  const deviceNow = Date.now();
  const clockSkewMs = measureSkew(res, deviceNow);

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
  writeCache(k, cached); // الانحراف لا يُخزَّن، فهو وصف للحظة لا للبيانات
  return { ...cached, clockSkewMs };
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
