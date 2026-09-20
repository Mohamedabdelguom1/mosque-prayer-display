import { formatTime } from '../../lib/format';

interface Props {
  now: Date;
  use24h: boolean;
  arabicDigits: boolean;
}

export function Clock({ now, use24h, arabicDigits }: Props) {
  const { hm, suffix } = formatTime(now, use24h, arabicDigits);

  return (
    <div className="clock">
      {/* المفتاح يعيد تشغيل حركة الرقم عند تبدّل الدقيقة فقط */}
      <span className="clock__time">
        <span className="clock__time-part" key={hm}>
          {hm}
        </span>
      </span>
      {suffix && <span className="clock__suffix">{suffix === 'ص' ? 'صباحاً' : 'مساءً'}</span>}
    </div>
  );
}
