import { useEffect, useState } from 'react';
import { useClock } from './hooks/useClock';
import { useSettings } from './hooks/useSettings';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { usePhase } from './hooks/usePhase';
import { useAdhanAudio } from './hooks/useAdhanAudio';
import { DisplayScreen } from './components/display/DisplayScreen';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { AudioUnlock } from './components/overlays/AudioUnlock';

/** لوحة الاعدادات تُفتح بـ Ctrl+Shift+S أو بالمسار ‎#/settings‎ */
function readSettingsRoute(): boolean {
  return window.location.hash.replace(/^#/, '') === '/settings';
}

export default function App() {
  const now = useClock();
  const { settings } = useSettings();
  const data = usePrayerTimes(now, settings);
  const phase = usePhase(now, data.schedule, settings);
  const audio = useAdhanAudio(settings);

  const [showSettings, setShowSettings] = useState(readSettingsRoute);

  // فتح واغلاق لوحة الاعدادات
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowSettings(true);
      }
      if (e.key === 'Escape') setShowSettings(false);
    };
    const onHash = () => setShowSettings(readSettingsRoute());

    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  // تشغيل الاذان عند دخول شاشة الاذان — الـ hook يمنع التكرار
  useEffect(() => {
    if (phase.phase === 'ADHAN' && phase.prayer) audio.playFor(phase.prayer);
    if (phase.phase === 'SILENCE') audio.stop();
  }, [phase.phase, phase.prayer, audio]);

  if (showSettings) {
    return (
      <SettingsPanel
        onClose={() => {
          if (window.location.hash) window.location.hash = '';
          setShowSettings(false);
        }}
      />
    );
  }

  // اول تشغيل بلا انترنت ولا كاش
  if (data.empty && !data.schedule) {
    return (
      <div className="boot">
        <div className="boot__title">جارٍ تحميل مواقيت الصلاة</div>
        <div className="boot__msg">
          {data.error
            ? 'تعذّر الاتصال بالخادم. تأكد من اتصال الجهاز بالإنترنت — ستُحفظ المواقيت بعد أول تحميل ناجح وتعمل الشاشة بعدها بلا إنترنت.'
            : 'يتم الآن جلب تقويم الشهر لمرة واحدة.'}
        </div>
        <div className="boot__hint">لفتح الإعدادات اضغط Ctrl + Shift + S</div>
      </div>
    );
  }

  return (
    <>
      <DisplayScreen now={now} data={data} phase={phase} />
      {audio.needsUnlock && settings.audioEnabled && <AudioUnlock onUnlock={audio.unlock} />}
    </>
  );
}
