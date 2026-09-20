import type { PrayerSlot } from '../../types';

/** شاشة الاذان: تظهر لحظة دخول الوقت */
export function AdhanOverlay({ prayer }: { prayer: PrayerSlot }) {
  return (
    <div className="overlay">
      <div className="overlay__halo" />
      <div className="overlay__halo" />
      <div className="overlay__halo" />

      <div className="overlay__kicker">حان الآن موعد أذان</div>
      <div className="overlay__prayer">{prayer.nameAr}</div>
      <div className="overlay__sub">حيّ على الصلاة .. حيّ على الفلاح</div>
      <div className="overlay__note">
        اللهم ربّ هذه الدعوة التامة والصلاة القائمة، آت محمداً الوسيلة والفضيلة
      </div>
    </div>
  );
}
