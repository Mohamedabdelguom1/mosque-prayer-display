import { describe, expect, it } from 'vitest';
import {
  formatCountdown,
  formatGregorian,
  formatTime,
  localDateKey,
  localizeDigits,
  weekdayAr,
} from './format';

const d = (h: number, m: number) => new Date(2026, 8, 20, h, m, 0, 0);

describe('localizeDigits', () => {
  it('يترك الارقام اللاتينية كما هي', () => {
    expect(localizeDigits('12:45', false)).toBe('12:45');
  });
  it('يحوّل الى الارقام الهندية دون المساس بغيرها', () => {
    expect(localizeDigits('12:45', true)).toBe('١٢:٤٥');
    expect(localizeDigits('5 يوماً', true)).toBe('٥ يوماً');
  });
});

describe('formatTime', () => {
  it('نظام 12 ساعة مع اللاحقة العربية', () => {
    expect(formatTime(d(5, 8), false, false)).toEqual({ hm: '5:08', suffix: 'ص' });
    expect(formatTime(d(19, 21), false, false)).toEqual({ hm: '7:21', suffix: 'م' });
  });

  it('منتصف الليل يظهر 12 صباحا لا صفرا', () => {
    expect(formatTime(d(0, 5), false, false)).toEqual({ hm: '12:05', suffix: 'ص' });
  });

  it('الظهيرة تماما تُعدّ مساءً', () => {
    expect(formatTime(d(12, 0), false, false)).toEqual({ hm: '12:00', suffix: 'م' });
  });

  it('نظام 24 ساعة بلا لاحقة ومع تصفير البادئة', () => {
    expect(formatTime(d(5, 8), true, false)).toEqual({ hm: '05:08', suffix: '' });
    expect(formatTime(d(19, 21), true, false)).toEqual({ hm: '19:21', suffix: '' });
  });
});

describe('formatCountdown', () => {
  it('يسقط الساعات عندما تكون صفرا', () => {
    expect(formatCountdown(125_000, false)).toBe('02:05');
  });
  it('يعرض الساعات عند تجاوزها', () => {
    expect(formatCountdown(3_725_000, false)).toBe('1:02:05');
  });
  it('لا يعطي قيمة سالبة', () => {
    expect(formatCountdown(-5000, false)).toBe('00:00');
  });
  it('يحترم الارقام الهندية', () => {
    expect(formatCountdown(125_000, true)).toBe('٠٢:٠٥');
  });
});

describe('التواريخ', () => {
  it('يكتب التاريخ الميلادي بالعربية', () => {
    expect(formatGregorian(d(12, 0), false)).toBe('20 سبتمبر 2026 م');
  });
  it('يحدّد اسم اليوم', () => {
    expect(weekdayAr(d(12, 0))).toBe('الأحد');
  });
  it('يبني مفتاح اليوم محليا بلا انزلاق المنطقة الزمنية', () => {
    // الساعة 23:30 محليا يجب ان تبقى في اليوم نفسه، لا ان تقفز ليوم تالٍ
    expect(localDateKey(d(23, 30))).toBe('2026-09-20');
    expect(localDateKey(d(0, 30))).toBe('2026-09-20');
  });
});
