import type { Settings } from '../types';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '../config/defaults';

/**
 * قراءة الاعدادات مع الدمج فوق الافتراضيات،
 * حتى لا تنكسر النسخ القديمة عند اضافة حقول جديدة.
 */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<Settings> & { backgroundUrl?: string };

    // ترحيل النسخ التي كانت تحفظ خلفية واحدة باسم backgroundUrl
    const backgrounds = saved.backgrounds?.length
      ? saved.backgrounds
      : saved.backgroundUrl
        ? [saved.backgroundUrl]
        : DEFAULT_SETTINGS.backgrounds;

    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      offsets: { ...DEFAULT_SETTINGS.offsets, ...saved.offsets },
      iqamaGaps: { ...DEFAULT_SETTINGS.iqamaGaps, ...saved.iqamaGaps },
      backgrounds,
      ayat: saved.ayat?.length ? saved.ayat : DEFAULT_SETTINGS.ayat,
      marqueeMessages: saved.marqueeMessages?.length
        ? saved.marqueeMessages
        : DEFAULT_SETTINGS.marqueeMessages,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // الحصة ممتلئة — على الارجح بسبب شعار كبير
  }
}
