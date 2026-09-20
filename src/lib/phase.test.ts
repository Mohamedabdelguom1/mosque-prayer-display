import { describe, expect, it } from 'vitest';
import { computePhase } from './phase';
import { computeSchedule } from './schedule';
import { DAYS, SETTINGS, at } from './testFixtures';

/*
 * الظهر في بيانات الاختبار 11:46، والاقامة بعده بـ15 دقيقة اي 12:01،
 * وشاشة الاذان 180 ثانية، وشاشة الصمت 8 دقائق بعد الاقامة اي حتى 12:09.
 */
const phaseAt = (h: number, m: number, s = 0, settings = SETTINGS) =>
  computePhase(at(h, m, s), computeSchedule(at(h, m, s), DAYS, settings), settings);

describe('computePhase', () => {
  it('بلا جدول يبقى في الوضع العادي', () => {
    expect(computePhase(at(12, 0), null, SETTINGS).phase).toBe('NORMAL');
  });

  it('قبل دخول الوقت: عادي', () => {
    expect(phaseAt(11, 45).phase).toBe('NORMAL');
  });

  it('لحظة دخول الوقت: شاشة الاذان', () => {
    const p = phaseAt(11, 46);
    expect(p.phase).toBe('ADHAN');
    expect(p.prayer?.key).toBe('Dhuhr');
    expect(p.remainingMs).toBe(180_000);
  });

  it('داخل مدة الاذان: يتناقص المتبقي ويتقدم الشريط', () => {
    const p = phaseAt(11, 47, 30);
    expect(p.phase).toBe('ADHAN');
    expect(p.remainingMs).toBe(90_000);
    expect(p.progress).toBeCloseTo(0.5, 5);
  });

  it('بعد انتهاء الاذان: العد التنازلي للاقامة', () => {
    const p = phaseAt(11, 50);
    expect(p.phase).toBe('IQAMA');
    expect(p.remainingMs).toBe(11 * 60_000);
  });

  it('لحظة الاقامة بالضبط: تبدأ شاشة الصمت', () => {
    const p = phaseAt(12, 1);
    expect(p.phase).toBe('SILENCE');
    expect(p.remainingMs).toBe(8 * 60_000);
  });

  it('داخل مدة الصمت', () => {
    expect(phaseAt(12, 5).phase).toBe('SILENCE');
  });

  it('بعد انتهاء الصمت: عودة للوضع العادي', () => {
    expect(phaseAt(12, 9).phase).toBe('NORMAL');
    expect(phaseAt(12, 30).phase).toBe('NORMAL');
  });

  it('الشروق لا يُطلق اي شاشة', () => {
    expect(phaseAt(5, 41).phase).toBe('NORMAL');
    expect(phaseAt(5, 45).phase).toBe('NORMAL');
  });

  it('صمت العشاء يستمر بعد انتقال اللوحة لمواقيت الغد', () => {
    // العشاء 18:21، الاقامة 18:33، والصمت حتى 18:41.
    // اللوحة تكون قد انتقلت لمواقيت الغد لان العشاء آخر اوقات اليوم،
    // ولولا الاعتماد على todayActual لاختفت الشاشة قبل اوانها.
    const s = computeSchedule(at(18, 35), DAYS, SETTINGS)!;
    expect(s.isNextDay).toBe(true);

    const p = computePhase(at(18, 35), s, SETTINGS);
    expect(p.phase).toBe('SILENCE');
    expect(p.prayer?.key).toBe('Isha');
  });

  it('تعطيل شاشة الاذان ينقل مباشرة للعد التنازلي', () => {
    const off = { ...SETTINGS, adhanScreenEnabled: false };
    expect(phaseAt(11, 47, 0, off).phase).toBe('IQAMA');
  });

  it('تعطيل كل الشاشات يُبقي الوضع عاديا طوال الوقت', () => {
    const off = {
      ...SETTINGS,
      adhanScreenEnabled: false,
      iqamaScreenEnabled: false,
      silenceScreenEnabled: false,
    };
    expect(phaseAt(11, 46, 0, off).phase).toBe('NORMAL');
    expect(phaseAt(11, 55, 0, off).phase).toBe('NORMAL');
    expect(phaseAt(12, 5, 0, off).phase).toBe('NORMAL');
  });

  it('تُحسب الحالة من الوقت لا من تسلسل، فتصحّح نفسها بعد انقطاع', () => {
    // قفزة مباشرة الى منتصف الصمت دون المرور بالاذان والاقامة،
    // كما يحدث لو أُعيد تشغيل الجهاز اثناء الصلاة
    expect(phaseAt(12, 4).phase).toBe('SILENCE');
  });
});
