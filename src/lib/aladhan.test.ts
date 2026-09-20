import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheKey, fetchMonth, pruneOldMonths, readCache, type MonthKey } from './aladhan';
import { FullStorage, MemoryStorage, installStorage } from './testStubs';

const KEY: MonthKey = {
  year: 2026,
  month: 9,
  latitude: 24.7136,
  longitude: 46.6753,
  method: 4,
  school: 0,
};

/** يوم واحد بصيغة Aladhan الخام، بما فيها لاحقة المنطقة الزمنية */
const rawDay = (gregorian: string, fajr: string) => ({
  timings: {
    Fajr: `${fajr} (+03)`,
    Sunrise: '05:41 (+03)',
    Dhuhr: '11:46 (+03)',
    Asr: '15:15 (+03)',
    Maghrib: '17:51 (+03)',
    Isha: '18:21 (+03)',
    Imsak: '04:13 (+03)',
  },
  date: {
    gregorian: { date: gregorian },
    hijri: {
      day: '9',
      month: { number: 4, ar: 'ربيع الآخر' },
      year: '1448',
      weekday: { ar: 'الأحد' },
    },
  },
});

const okResponse = (days: unknown[], dateHeader?: string, ageHeader?: string) => ({
  ok: true,
  status: 200,
  headers: {
    get: (h: string) => {
      if (h === 'date') return dateHeader ?? null;
      if (h === 'age') return ageHeader ?? null;
      return null;
    },
  },
  json: async () => ({ code: 200, data: days }),
});

beforeEach(() => installStorage(new MemoryStorage()));
afterEach(() => vi.unstubAllGlobals());

describe('cacheKey', () => {
  it('يميّز بين المواقع وطرق الحساب والاشهر', () => {
    const a = cacheKey(KEY);
    expect(a).toContain('2026-09');
    expect(cacheKey({ ...KEY, method: 3 })).not.toBe(a);
    expect(cacheKey({ ...KEY, school: 1 })).not.toBe(a);
    expect(cacheKey({ ...KEY, month: 10 })).not.toBe(a);
    expect(cacheKey({ ...KEY, latitude: 21.3891 })).not.toBe(a);
  });

  it('يصفّر الشهر برقمين حتى لا يختلط 2026-1 بـ 2026-10', () => {
    expect(cacheKey({ ...KEY, month: 1 })).toContain('2026-01');
  });
});

describe('fetchMonth', () => {
  it('يحلّل الوقت مع لاحقة المنطقة الى دقائق منذ منتصف الليل', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([rawDay('20-09-2026', '04:23')])));

    const month = await fetchMonth(KEY);
    const day = month.days['2026-09-20'];

    expect(day.minutes.Fajr).toBe(4 * 60 + 23);
    expect(day.minutes.Isha).toBe(18 * 60 + 21);
  });

  it('يحوّل التاريخ من DD-MM-YYYY الى مفتاح YYYY-MM-DD', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([rawDay('05-01-2027', '05:30')])));

    const month = await fetchMonth({ ...KEY, year: 2027, month: 1 });
    expect(Object.keys(month.days)).toEqual(['2027-01-05']);
    expect(month.days['2027-01-05'].gregorian).toBe('2027-01-05');
  });

  it('يستخرج التاريخ الهجري جاهزا فلا يحتاج طلبا آخر', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([rawDay('20-09-2026', '04:23')])));

    const { hijri } = (await fetchMonth(KEY)).days['2026-09-20'];
    expect(hijri).toEqual({
      day: 9,
      month: 4,
      year: 1448,
      monthNameAr: 'ربيع الآخر',
      weekdayAr: 'الأحد',
    });
  });

  it('يمرّر الموقع وطريقة الحساب في الرابط', async () => {
    // نعلن المعاملات صراحة كي يعرف TypeScript نوع ما سُجّل في mock.calls
    const spy = vi.fn(async (_url: string, _init?: RequestInit) =>
      okResponse([rawDay('20-09-2026', '04:23')]),
    );
    vi.stubGlobal('fetch', spy);

    await fetchMonth(KEY);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain('/2026/9');
    expect(url).toContain('latitude=24.7136');
    expect(url).toContain('method=4');
    expect(url).toContain('school=0');
  });

  it('يكتب النتيجة في الكاش فتُقرأ لاحقا بلا شبكة', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([rawDay('20-09-2026', '04:23')])));
    await fetchMonth(KEY);

    vi.unstubAllGlobals(); // لا شبكة بعد الآن
    const cached = readCache(KEY)!;
    expect(cached.days['2026-09-20'].minutes.Fajr).toBe(263);
    expect(cached.fetchedAt).toBeGreaterThan(0);
  });

  it('يرفض عند خطأ HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
    await expect(fetchMonth(KEY)).rejects.toThrow('503');
  });

  it('يرفض عند رد غير متوقع رغم نجاح HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ code: 400 }) })));
    await expect(fetchMonth(KEY)).rejects.toThrow();
  });

  it('لا ينهار اذا امتلأت حصة التخزين', async () => {
    installStorage(new FullStorage());
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([rawDay('20-09-2026', '04:23')])));

    const month = await fetchMonth(KEY);
    expect(month.days['2026-09-20']).toBeDefined(); // الذاكرة الحيّة تعمل
  });
});

describe('قياس انحراف ساعة الجهاز', () => {
  const day = () => rawDay('20-09-2026', '04:23');

  it('يقيس الفارق من ترويسة Date التي يرسلها الخادم', async () => {
    const serverTime = new Date('2026-09-20T12:00:00Z');
    vi.setSystemTime(new Date(serverTime.getTime() + 3 * 86_400_000)); // الجهاز متقدّم ثلاثة ايام
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([day()], serverTime.toUTCString())));

    const { clockSkewMs } = await fetchMonth(KEY);
    expect(clockSkewMs).not.toBeNull();
    expect(Math.round(clockSkewMs! / 86_400_000)).toBe(3);

    vi.useRealTimers();
  });

  it('سالب حين تكون ساعة الجهاز متأخّرة', async () => {
    const serverTime = new Date('2026-09-20T12:00:00Z');
    vi.setSystemTime(new Date(serverTime.getTime() - 2 * 3_600_000));
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([day()], serverTime.toUTCString())));

    const { clockSkewMs } = await fetchMonth(KEY);
    expect(clockSkewMs!).toBeLessThan(0);

    vi.useRealTimers();
  });

  it('يطلب بلا كاش، فالخادم يرسل max-age=3600 ولو خُزّن الرد لقِسنا عمره لا ساعتنا', async () => {
    const spy = vi.fn(async (_url: string, _init?: RequestInit) =>
      okResponse([day()], new Date().toUTCString()),
    );
    vi.stubGlobal('fetch', spy);

    await fetchMonth(KEY);
    expect(spy.mock.calls[0][1]?.cache).toBe('no-store');
  });

  it('لا ينبّه على رد جاء من وسيط: ترويسة Age تعني نسخة مخزّنة', async () => {
    // هذا ما اوقع الانذار الكاذب "ساعة الجهاز خاطئة بفارق 21 دقيقة":
    // تاريخ الرد كان عمره 21 دقيقة لانه محفوظ، والساعة سليمة تماما
    const stale = new Date(Date.now() - 21 * 60_000).toUTCString();
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([day()], stale, '1260')));

    expect((await fetchMonth(KEY)).clockSkewMs).toBeNull();
  });

  it('null اذا لم يرسل الخادم ترويسة Date', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([day()])));
    expect((await fetchMonth(KEY)).clockSkewMs).toBeNull();
  });

  it('null ولا انهيار اذا لم يكن للرد ترويسات اصلا', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ code: 200, data: [day()] }),
    })));
    expect((await fetchMonth(KEY)).clockSkewMs).toBeNull();
  });

  it('لا يُخزَّن الانحراف في الكاش فهو وصف للحظة لا للبيانات', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse([day()], new Date().toUTCString())));
    await fetchMonth(KEY);
    expect(readCache(KEY)).not.toHaveProperty('clockSkewMs');
  });
});

describe('readCache', () => {
  it('يرجع null اذا لا شيء محفوظ', () => {
    expect(readCache(KEY)).toBeNull();
  });

  it('يرجع null ولا يرمي عند بيانات تالفة', () => {
    localStorage.setItem(cacheKey(KEY), '{ليس JSON');
    expect(readCache(KEY)).toBeNull();
  });

  it('يرجع null عند بنية ناقصة', () => {
    localStorage.setItem(cacheKey(KEY), JSON.stringify({ days: null }));
    expect(readCache(KEY)).toBeNull();
  });
});

describe('pruneOldMonths', () => {
  it('يحذف الاشهر القديمة ويبقي المطلوبة', () => {
    const keep = cacheKey(KEY);
    const old = cacheKey({ ...KEY, month: 7 });
    localStorage.setItem(keep, '{}');
    localStorage.setItem(old, '{}');

    pruneOldMonths([keep]);

    expect(localStorage.getItem(keep)).not.toBeNull();
    expect(localStorage.getItem(old)).toBeNull();
  });

  it('لا يمسّ مفاتيح خارج نطاق المواقيت مثل الاعدادات', () => {
    localStorage.setItem('mosque-display:settings:v1', '{"mosqueName":"x"}');
    localStorage.setItem(cacheKey({ ...KEY, month: 7 }), '{}');

    pruneOldMonths([cacheKey(KEY)]);

    expect(localStorage.getItem('mosque-display:settings:v1')).not.toBeNull();
  });
});
