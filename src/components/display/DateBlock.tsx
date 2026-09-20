import type { DayTimings } from '../../types';
import { formatGregorian, localizeDigits, weekdayAr } from '../../lib/format';

interface Props {
  now: Date;
  today: DayTimings | null;
  arabicDigits: boolean;
}

export function DateBlock({ now, today, arabicDigits }: Props) {
  const hijri = today
    ? `${weekdayAr(now)}   ${localizeDigits(String(today.hijri.day), arabicDigits)} ${
        today.hijri.monthNameAr
      } ${localizeDigits(String(today.hijri.year), arabicDigits)} هـ`
    : weekdayAr(now);

  return (
    <div className="timebox__dates">
      <div className="dates__hijri">{hijri}</div>
      <div className="dates__greg">{formatGregorian(now, arabicDigits)}</div>
    </div>
  );
}
