import { describe, expect, it } from 'vitest';
import { buildSlots, computeSchedule, daysUntilRamadan, isPrayerKey } from './schedule';
import { DAY_1, DAYS, SETTINGS, at } from './testFixtures';

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

describe('isPrayerKey', () => {
  it('يستثني الشروق فهو ليس صلاة', () => {
    expect(isPrayerKey('Sunrise')).toBe(false);
    expect(isPrayerKey('Fajr')).toBe(true);
    expect(isPrayerKey('Isha')).toBe(true);
  });
});

describe('buildSlots', () => {
  it('يبني المواعيد الستة بالترتيب الزمني', () => {
    const slots = buildSlots(DAY_1, at(12, 0), SETTINGS);
    expect(slots.map((s) => s.key)).toEqual([
      'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha',
    ]);
    expect(slots.map((s) => hhmm(s.at))).toEqual([
      '04:23', '05:41', '11:46', '15:15', '17:51', '18:21',
    ]);
  });

  it('يضيف وقت الاقامة للصلوات دون الشروق', () => {
    const slots = buildSlots(DAY_1, at(12, 0), SETTINGS);
    const byKey = Object.fromEntries(slots.map((s) => [s.key, s]));

    expect(hhmm(byKey.Fajr.iqamaAt!)).toBe('04:43');     // +20
    expect(hhmm(byKey.Maghrib.iqamaAt!)).toBe('17:58');  // +7
    expect(byKey.Sunrise.iqamaAt).toBeUndefined();
  });

  it('يطبّق تعديل الدقائق موجبا وسالبا', () => {
    const tweaked = { ...SETTINGS, offsets: { ...SETTINGS.offsets, Fajr: 3, Isha: -5 } };
    const byKey = Object.fromEntries(
      buildSlots(DAY_1, at(12, 0), tweaked).map((s) => [s.key, s]),
    );
    expect(hhmm(byKey.Fajr.at)).toBe('04:26');
    expect(hhmm(byKey.Isha.at)).toBe('18:16');
  });
});

describe('computeSchedule', () => {
  it('يرجع null اذا لم تتوفر مواقيت اليوم', () => {
    expect(computeSchedule(at(12, 0), {}, SETTINGS)).toBeNull();
  });

  it('قبل الفجر: القادم الفجر ولا وقت حاليا', () => {
    const s = computeSchedule(at(3, 0), DAYS, SETTINGS)!;
    expect(s.next.key).toBe('Fajr');
    expect(s.current).toBeNull();
    expect(s.isNextDay).toBe(false);
  });

  it('بين الاوقات: يحدّد الحالي والقادم بدقة', () => {
    const s = computeSchedule(at(12, 30), DAYS, SETTINGS)!;
    expect(s.current?.key).toBe('Dhuhr');
    expect(s.next.key).toBe('Asr');
    expect(s.msUntilNext).toBe((915 - 750) * 60_000);
  });

  it('لحظة دخول الوقت بالضبط تُعدّ دخولا لا انتظارا', () => {
    const s = computeSchedule(at(11, 46), DAYS, SETTINGS)!;
    expect(s.current?.key).toBe('Dhuhr');
    expect(s.next.key).toBe('Asr');
  });

  it('الشروق يظهر كوقت حالي لكنه لا يُعدّ صلاة', () => {
    const s = computeSchedule(at(6, 0), DAYS, SETTINGS)!;
    expect(s.current?.key).toBe('Sunrise');
    expect(s.current?.isPrayer).toBe(false);
  });

  it('بعد العشاء: اللوحة تنتقل لمواقيت الغد والقادم فجر الغد', () => {
    const s = computeSchedule(at(22, 30), DAYS, SETTINGS)!;

    expect(s.isNextDay).toBe(true);
    expect(s.next.key).toBe('Fajr');
    // 04:24 مواقيت الغد، لا 04:23 مواقيت اليوم المنقضي
    expect(hhmm(s.next.at)).toBe('04:24');
    expect(s.next.at.getDate()).toBe(21);
    // البطاقات المعروضة صارت مواقيت الغد
    expect(hhmm(s.today[0].at)).toBe('04:24');
    // اما todayActual فيبقى اليوم الحقيقي لاجل شاشات الاذان
    expect(hhmm(s.todayActual[0].at)).toBe('04:23');
    expect(s.todayActual[0].at.getDate()).toBe(20);
  });

  it('العداد بعد العشاء يقيس الى فجر الغد لا الى ماض سالب', () => {
    const s = computeSchedule(at(22, 30), DAYS, SETTINGS)!;
    expect(s.msUntilNext).toBeGreaterThan(0);
    expect(s.msUntilNext).toBe(((24 * 60 - 1350) + 264) * 60_000);
  });

  it('بلا بيانات للغد يستعمل مواقيت اليوم كحل اخير بلا انهيار', () => {
    const onlyToday = { '2026-09-20': DAY_1 };
    const s = computeSchedule(at(22, 30), onlyToday, SETTINGS)!;
    expect(s.next.key).toBe('Fajr');
    expect(s.next.at.getDate()).toBe(21);
    expect(s.msUntilNext).toBeGreaterThan(0);
  });
});

describe('daysUntilRamadan', () => {
  it('يرجع صفرا داخل رمضان', () => {
    const inRamadan = { ...DAY_1, hijri: { ...DAY_1.hijri, month: 9, day: 3 } };
    expect(daysUntilRamadan(inRamadan)).toBe(0);
  });

  it('يقدّر الايام قبل رمضان ويبقى موجبا', () => {
    const shaban = { ...DAY_1, hijri: { ...DAY_1.hijri, month: 8, day: 20 } };
    const d = daysUntilRamadan(shaban)!;
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(15);
  });

  it('بعد رمضان يلتفّ للسنة القادمة ولا يعطي رقما سالبا', () => {
    const shawwal = { ...DAY_1, hijri: { ...DAY_1.hijri, month: 10, day: 5 } };
    const d = daysUntilRamadan(shawwal)!;
    expect(d).toBeGreaterThan(300);
  });
});
