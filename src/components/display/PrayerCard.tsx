import type { PrayerKey, PrayerSlot } from '../../types';
import { formatTime } from '../../lib/format';
import {
  AfternoonIcon,
  MoonIcon,
  SunIcon,
  SunriseIcon,
  SunsetIcon,
} from './icons';

const ICONS: Record<PrayerKey, (p: { className?: string }) => React.JSX.Element> = {
  Fajr: SunriseIcon,
  Sunrise: SunriseIcon,
  Dhuhr: SunIcon,
  Asr: AfternoonIcon,
  Maghrib: SunsetIcon,
  Isha: MoonIcon,
};

interface Props {
  slot: PrayerSlot;
  index: number;
  isNext: boolean;
  isPast: boolean;
  use24h: boolean;
  arabicDigits: boolean;
}

export function PrayerCard({ slot, index, isNext, isPast, use24h, arabicDigits }: Props) {
  const Icon = ICONS[slot.key];
  const { hm, suffix } = formatTime(slot.at, use24h, arabicDigits);

  const classes = [
    'card',
    isNext ? 'card--active' : '',
    isPast && !isNext ? 'card--past' : '',
    slot.key === 'Sunrise' ? 'card--sunrise' : '',
  ]
    .filter(Boolean)
    .join(' ');

  /*
   * الغلاف يحمل حركة الدخول والبطاقة تحمل نبض التمييز.
   * فصلهما مقصود: لو اجتمعا في عنصر واحد لأعادت حركة الدخول التشغيل
   * كلما انتقل التمييز من بطاقة الى اخرى، فيظهر الانتقال كأنه خلل.
   */
  return (
    <div className="card-slot" style={{ '--i': index } as React.CSSProperties}>
      <div className={classes}>
        <Icon className="card__icon" />
        <div className="card__name">{slot.nameAr}</div>
        <div className="card__time">{hm}</div>
        {suffix && <div className="card__suffix">{suffix}</div>}
        {isNext && <div className="card__badge">حان الآن</div>}
      </div>
    </div>
  );
}
