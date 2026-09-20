import type { DayTimings, ScheduleState } from '../../types';
import { formatCountdown, localizeDigits } from '../../lib/format';
import { daysUntilRamadan } from '../../lib/schedule';
import { qiblaBearing } from '../../lib/qibla';
import { CalendarIcon, KaabaIcon, MihrabIcon } from './icons';

interface Props {
  schedule: ScheduleState;
  today: DayTimings | null;
  latitude: number;
  longitude: number;
  arabicDigits: boolean;
}

export function InfoStrip({ schedule, today, latitude, longitude, arabicDigits }: Props) {
  const bearing = Math.round(qiblaBearing(latitude, longitude));
  const ramadan = today ? daysUntilRamadan(today) : null;

  return (
    <div className="infostrip">
      {/* الايام المتبقية على رمضان */}
      <div className="info">
        <CalendarIcon className="info__icon" />
        <div className="info__text">
          <div className="info__label">
            {ramadan === 0 ? 'شهر رمضان المبارك' : 'الأيام المتبقية على رمضان'}
          </div>
          <div className="info__value">
            {ramadan === null
              ? '—'
              : ramadan === 0
                ? 'تقبل الله طاعتكم'
                : `${localizeDigits(String(ramadan), arabicDigits)} يوماً`}
          </div>
        </div>
      </div>

      {/* العدّ التنازلي للصلاة القادمة */}
      <div className="info">
        <MihrabIcon className="info__icon" />
        <div className="info__text">
          <div className="info__label">متبقي على {schedule.next.nameAr}</div>
          <div className="info__value info__value--ltr info__value--tick">
            {formatCountdown(schedule.msUntilNext, arabicDigits)}
          </div>
        </div>
      </div>

      {/* اتجاه القبلة */}
      <div className="info">
        <KaabaIcon className="info__icon" />
        <div className="info__text">
          <div className="info__label">القبلة</div>
          <div className="info__value">
            {localizeDigits(String(bearing), arabicDigits)}°
          </div>
          <div className="info__label">(من الشمال)</div>
        </div>
      </div>
    </div>
  );
}
