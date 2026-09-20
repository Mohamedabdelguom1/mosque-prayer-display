import type { PrayerSlot } from '../../types';

/** شاشة هادئة اثناء الصلاة */
export function SilenceNotice({ prayer }: { prayer: PrayerSlot }) {
  return (
    <div className="overlay overlay--silence">
      <div className="overlay__kicker">أُقيمت صلاة {prayer.nameAr}</div>
      <div className="overlay__prayer">أغلق جوالك</div>
      <div className="overlay__note">
        احتراماً لبيت الله ولخشوع إخوانك المصلّين
      </div>
    </div>
  );
}
