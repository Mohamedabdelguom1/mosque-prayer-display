import { useEffect, useState } from 'react';
import { useClock } from './hooks/useClock';
import { useSettings } from './hooks/settingsContext';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { usePhase } from './hooks/usePhase';
import { useAdhanAudio } from './hooks/useAdhanAudio';
import { DisplayScreen } from './components/display/DisplayScreen';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { AudioUnlock } from './components/overlays/AudioUnlock';
import { isOkKey, pushPress } from './lib/remoteGesture';

/**
 * لوحة الاعدادات تُفتح بثلاث طرق:
 *  - خمس ضغطات على OK في ريموت التلفاز (الطريقة الوحيدة المتاحة هناك)
 *  - Ctrl+Shift+S على لوحة مفاتيح
 *  - المسار ‎#/settings‎ مباشرة
 *
 * والمسار هو مصدر الحقيقة في الحالتين، حتى يُخرج زر الرجوع في الريموت
 * من اللوحة بدل ان يغادر الصفحة كلها.
 */
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
    let presses: number[] = [];

    const open = () => {
      if (!readSettingsRoute()) window.location.hash = '/settings';
    };
    const close = () => {
      if (readSettingsRoute()) window.history.back();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        open();
        return;
      }
      if (e.key === 'Escape') {
        close();
        return;
      }

      // ايماءة الريموت — نعدّها على شاشة العرض فقط لا داخل اللوحة،
      // والا فتحت نفسها كلما ضغط المشرف OK على حقل من حقولها
      if (!readSettingsRoute() && isOkKey(e.key)) {
        const r = pushPress(presses, Date.now());
        presses = r.presses;
        if (r.triggered) open();
      }
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
    return <SettingsPanel onClose={() => window.history.back()} />;
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
