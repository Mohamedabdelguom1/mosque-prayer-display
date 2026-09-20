import { useEffect } from 'react';
import type { PhaseState, PrayerTimesLike } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { BackgroundScene } from './BackgroundScene';
import { MosqueIdentity } from './MosqueIdentity';
import { AyahRotator } from './AyahRotator';
import { DateBlock } from './DateBlock';
import { Clock } from './Clock';
import { PrayerGrid } from './PrayerGrid';
import { InfoStrip } from './InfoStrip';
import { SideBanner } from './SideBanner';
import { Marquee } from './Marquee';
import { AdhanOverlay } from '../overlays/AdhanOverlay';
import { IqamaCountdown } from '../overlays/IqamaCountdown';
import { SilenceNotice } from '../overlays/SilenceNotice';
import { startBurnInProtection } from '../../lib/burnIn';

interface Props {
  now: Date;
  data: PrayerTimesLike;
  phase: PhaseState;
}

export function DisplayScreen({ now, data, phase }: Props) {
  const { settings } = useSettings();
  const { schedule, today, stale } = data;

  useEffect(() => {
    if (!settings.burnInProtection) return;
    return startBurnInProtection();
  }, [settings.burnInProtection]);

  if (!schedule) return null;

  return (
    <div className="screen">
      <BackgroundScene
        images={settings.backgrounds}
        seconds={settings.backgroundRotateSeconds}
      />

      {stale && <div className="stale">تعذّر تحديث المواقيت — يُعرض آخر جدول محفوظ</div>}

      <div className="screen__content">
        {/* الترتيب هنا مقصود: في واجهة RTL يقع اول عنصر في اقصى اليمين.
            الساعة يميناً والآية في الوسط وهوية المسجد يساراً كالتصميم المرجعي. */}
        <header className="topbar">
          <div className="timebox">
            <Clock now={now} use24h={settings.use24h} arabicDigits={settings.arabicNumerals} />
            <DateBlock now={now} today={today} arabicDigits={settings.arabicNumerals} />
          </div>

          <AyahRotator ayat={settings.ayat} seconds={settings.ayahRotateSeconds} />

          <MosqueIdentity
            name={settings.mosqueName}
            tagline={settings.tagline}
            logoDataUrl={settings.logoDataUrl}
          />
        </header>

        <div className="grid-wrap">
          <PrayerGrid
            schedule={schedule}
            now={now}
            use24h={settings.use24h}
            arabicDigits={settings.arabicNumerals}
          />
        </div>

        <InfoStrip
          schedule={schedule}
          today={today}
          latitude={settings.latitude}
          longitude={settings.longitude}
          arabicDigits={settings.arabicNumerals}
        />

        <div className="side-rail">
          <SideBanner line1={settings.sideBannerLine1} line2={settings.sideBannerLine2} />
        </div>

        <Marquee messages={settings.marqueeMessages} seconds={settings.marqueeSeconds} />
      </div>

      {phase.phase === 'ADHAN' && phase.prayer && <AdhanOverlay prayer={phase.prayer} />}
      {phase.phase === 'IQAMA' && (
        <IqamaCountdown phase={phase} arabicDigits={settings.arabicNumerals} />
      )}
      {phase.phase === 'SILENCE' && phase.prayer && <SilenceNotice prayer={phase.prayer} />}
    </div>
  );
}
