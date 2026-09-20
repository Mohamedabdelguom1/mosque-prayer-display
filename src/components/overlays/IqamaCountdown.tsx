import type { PhaseState } from '../../types';
import { formatCountdown } from '../../lib/format';

/** عدّاد تنازلي حتى الاقامة */
export function IqamaCountdown({
  phase,
  arabicDigits,
}: {
  phase: PhaseState;
  arabicDigits: boolean;
}) {
  if (!phase.prayer) return null;

  return (
    <div className="overlay">
      <div className="overlay__kicker">الإقامة بعد</div>
      <div className="overlay__countdown">
        {formatCountdown(phase.remainingMs, arabicDigits)}
      </div>
      <div className="overlay__sub">صلاة {phase.prayer.nameAr}</div>

      <div
        className="overlay__bar"
        style={{ '--progress': String(1 - phase.progress) } as React.CSSProperties}
      >
        <div className="overlay__bar-fill" />
      </div>

      <div className="overlay__note">سوّوا صفوفكم، فإن تسوية الصف من تمام الصلاة</div>
    </div>
  );
}
