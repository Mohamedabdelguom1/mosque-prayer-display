import { beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, saveSettings } from './storage';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '../config/defaults';
import { FullStorage, MemoryStorage, installStorage } from './testStubs';

beforeEach(() => installStorage(new MemoryStorage()));

const save = (partial: Record<string, unknown>) =>
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(partial));

describe('loadSettings', () => {
  it('يرجع الافتراضي عند اول تشغيل', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('يرجع الافتراضي ولا يرمي عند ملف تالف', () => {
    localStorage.setItem(SETTINGS_KEY, 'ليس JSON');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('يدمج المحفوظ فوق الافتراضي', () => {
    save({ mosqueName: 'جامع الفرقان', city: 'جدة' });
    const s = loadSettings();
    expect(s.mosqueName).toBe('جامع الفرقان');
    expect(s.city).toBe('جدة');
    expect(s.method).toBe(DEFAULT_SETTINGS.method); // لم يُحفظ فبقي افتراضيا
  });

  it('يُكمل الحقول الناقصة داخل offsets وiqamaGaps', () => {
    // نسخة قديمة حفظت بعض المفاتيح فقط — يجب الا تنكسر
    save({ offsets: { Fajr: 2 }, iqamaGaps: { Maghrib: 5 } });
    const s = loadSettings();

    expect(s.offsets.Fajr).toBe(2);
    expect(s.offsets.Isha).toBe(DEFAULT_SETTINGS.offsets.Isha);
    expect(s.iqamaGaps.Maghrib).toBe(5);
    expect(s.iqamaGaps.Fajr).toBe(DEFAULT_SETTINGS.iqamaGaps.Fajr);
  });

  it('يرحّل backgroundUrl المفرد الى قائمة backgrounds', () => {
    save({ backgroundUrl: './bg/custom.jpg' });
    expect(loadSettings().backgrounds).toEqual(['./bg/custom.jpg']);
  });

  it('يفضّل backgrounds على backgroundUrl اذا وُجدا معا', () => {
    save({ backgroundUrl: './bg/old.jpg', backgrounds: ['./bg/a.webp', './bg/b.webp'] });
    expect(loadSettings().backgrounds).toEqual(['./bg/a.webp', './bg/b.webp']);
  });

  it('قائمة خلفيات فارغة تعود للافتراضي بدل ترك الشاشة بلا خلفية', () => {
    save({ backgrounds: [] });
    expect(loadSettings().backgrounds).toEqual(DEFAULT_SETTINGS.backgrounds);
  });

  it('قوائم الآيات والرسائل الفارغة تعود للافتراضي', () => {
    save({ ayat: [], marqueeMessages: [] });
    const s = loadSettings();
    expect(s.ayat).toEqual(DEFAULT_SETTINGS.ayat);
    expect(s.marqueeMessages).toEqual(DEFAULT_SETTINGS.marqueeMessages);
  });

  it('يحترم قوائم المحتوى غير الفارغة', () => {
    save({ marqueeMessages: ['رسالة واحدة'] });
    expect(loadSettings().marqueeMessages).toEqual(['رسالة واحدة']);
  });
});

describe('saveSettings', () => {
  it('يحفظ ويقرأ ذهابا وايابا', () => {
    const next = { ...DEFAULT_SETTINGS, mosqueName: 'مسجد قباء', silenceMinutes: 12 };
    saveSettings(next);
    const back = loadSettings();
    expect(back.mosqueName).toBe('مسجد قباء');
    expect(back.silenceMinutes).toBe(12);
  });

  it('لا ينهار اذا امتلأت الحصة بسبب شعار كبير', () => {
    installStorage(new FullStorage());
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
  });
});
