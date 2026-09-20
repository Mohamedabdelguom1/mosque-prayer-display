import type { PrayerSlot, ScheduleState } from '../../types';
import { DISPLAY_ORDER } from '../../config/defaults';
import { PrayerCard } from './PrayerCard';

interface Props {
  schedule: ScheduleState;
  now: Date;
  use24h: boolean;
  arabicDigits: boolean;
}

export function PrayerGrid({ schedule, now, use24h, arabicDigits }: Props) {
  const byKey = new Map<string, PrayerSlot>(schedule.today.map((s) => [s.key, s]));

  return (
    <div className="prayer-grid">
      {DISPLAY_ORDER.map((key, i) => {
        const slot = byKey.get(key);
        if (!slot) return null;
        return (
          <PrayerCard
            key={key}
            slot={slot}
            index={i}
            isNext={schedule.next.key === key}
            isPast={slot.at.getTime() <= now.getTime()}
            use24h={use24h}
            arabicDigits={arabicDigits}
          />
        );
      })}
    </div>
  );
}
