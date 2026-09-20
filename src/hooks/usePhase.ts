import { useMemo } from 'react';
import type { PhaseState, ScheduleState, Settings } from '../types';
import { computePhase } from '../lib/phase';

/** غلاف يحفظ نتيجة computePhase — المنطق نفسه دالة خالصة قابلة للاختبار */
export function usePhase(
  now: Date,
  schedule: ScheduleState | null,
  settings: Settings,
): PhaseState {
  return useMemo(() => computePhase(now, schedule, settings), [now, schedule, settings]);
}
