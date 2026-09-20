import type { PhaseState, PrayerSlot, ScheduleState, Settings } from '../types';

/**
 * آلة حالات شاشات الاذان والاقامة — دالة خالصة.
 *
 *   NORMAL --(دخل وقت صلاة)--> ADHAN --> IQAMA --> SILENCE --> NORMAL
 *
 * الحالة تُحسب من الوقت الحالي مقارنة بالجدول، لا من مؤقّتات متتابعة،
 * فتُصحّح نفسها تلقائيا لو نام الجهاز أو تأخّر التنفيذ أو أُعيد تحميل الصفحة.
 */

export const IDLE_PHASE: PhaseState = {
  phase: 'NORMAL',
  prayer: null,
  remainingMs: 0,
  progress: 0,
};

/** آخر صلاة دخل وقتها ضمن نافذة زمنية قريبة */
function findRecentPrayer(
  schedule: ScheduleState,
  now: number,
  windowMs: number,
): PrayerSlot | null {
  for (let i = schedule.todayActual.length - 1; i >= 0; i--) {
    const slot = schedule.todayActual[i];
    if (!slot.isPrayer) continue;
    const elapsed = now - slot.at.getTime();
    if (elapsed >= 0 && elapsed <= windowMs) return slot;
  }
  return null;
}

export function computePhase(
  now: Date,
  schedule: ScheduleState | null,
  settings: Settings,
): PhaseState {
  if (!schedule) return IDLE_PHASE;

  const t = now.getTime();
  const adhanMs = settings.adhanScreenSeconds * 1000;
  const silenceMs = settings.silenceMinutes * 60_000;

  // اطول نافذة ممكنة: الاذان + اقصى فرق اقامة + الصمت
  const maxGapMs = Math.max(...Object.values(settings.iqamaGaps)) * 60_000;
  const slot = findRecentPrayer(schedule, t, adhanMs + maxGapMs + silenceMs);
  if (!slot || !slot.iqamaAt) return IDLE_PHASE;

  const since = t - slot.at.getTime();
  const iqamaAt = slot.iqamaAt.getTime();

  // 1) شاشة الاذان
  if (settings.adhanScreenEnabled && since < adhanMs) {
    return {
      phase: 'ADHAN',
      prayer: slot,
      remainingMs: adhanMs - since,
      progress: since / adhanMs,
    };
  }

  // 2) العدّ التنازلي للاقامة
  if (settings.iqamaScreenEnabled && t < iqamaAt) {
    const total = iqamaAt - slot.at.getTime();
    return {
      phase: 'IQAMA',
      prayer: slot,
      remainingMs: iqamaAt - t,
      progress: since / total,
    };
  }

  // 3) شاشة الصمت بعد الاقامة
  const sinceIqama = t - iqamaAt;
  if (settings.silenceScreenEnabled && sinceIqama >= 0 && sinceIqama < silenceMs) {
    return {
      phase: 'SILENCE',
      prayer: slot,
      remainingMs: silenceMs - sinceIqama,
      progress: sinceIqama / silenceMs,
    };
  }

  return IDLE_PHASE;
}
