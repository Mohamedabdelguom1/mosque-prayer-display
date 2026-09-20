import { useCallback, useEffect, useRef, useState } from 'react';
import type { PrayerSlot, Settings } from '../types';

/**
 * تشغيل صوت الاذان.
 *
 * المتصفحات تمنع التشغيل التلقائي قبل تفاعل المستخدم.
 * في وضع Kiosk نمرّر --autoplay-policy=no-user-gesture-required فيختفي القيد،
 * وفي المتصفح العادي نعرض لافتة تفعيل تظهر مرة واحدة فقط.
 */

const UNLOCK_KEY = 'mosque-display:audio-unlocked';

const AUDIO_SRC = {
  fajr: './audio/adhan-fajr.mp3',
  normal: './audio/adhan.mp3',
};

export interface AdhanAudio {
  /** هل يحتاج المستخدم للضغط لتفعيل الصوت */
  needsUnlock: boolean;
  unlock: () => void;
  /** يُستدعى عند دخول شاشة الاذان */
  playFor: (slot: PrayerSlot) => void;
  stop: () => void;
}

export function useAdhanAudio(settings: Settings): AdhanAudio {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedForRef = useRef<string | null>(null);

  const [needsUnlock, setNeedsUnlock] = useState(() => {
    if (!settings.audioEnabled) return false;
    try {
      return localStorage.getItem(UNLOCK_KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const el = new Audio();
    el.preload = 'auto';
    audioRef.current = el;
    return () => {
      el.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = settings.audioVolume;
  }, [settings.audioVolume]);

  const unlock = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    // تشغيل صامت قصير يفكّ قفل التشغيل التلقائي لبقية الجلسة
    el.muted = true;
    void el
      .play()
      .catch(() => undefined)
      .finally(() => {
        el.pause();
        el.currentTime = 0;
        el.muted = false;
      });
    try {
      localStorage.setItem(UNLOCK_KEY, '1');
    } catch {
      // تجاهل
    }
    setNeedsUnlock(false);
  }, []);

  const playFor = useCallback(
    (slot: PrayerSlot) => {
      if (!settings.audioEnabled) return;
      const el = audioRef.current;
      if (!el) return;

      // مفتاح فريد لكل وقت صلاة حتى لا يتكرر التشغيل في كل نبضة ثانية
      const token = `${slot.key}:${slot.at.toDateString()}`;
      if (playedForRef.current === token) return;
      playedForRef.current = token;

      el.src = slot.key === 'Fajr' ? AUDIO_SRC.fajr : AUDIO_SRC.normal;
      el.volume = settings.audioVolume;
      el.currentTime = 0;
      void el.play().catch((err: unknown) => {
        // نفرّق بين منع التشغيل التلقائي وبين ملف صوت مفقود:
        // الاول يُعالج بلافتة تفعيل، والثاني لا يستحق ازعاج المصلّين
        // فالشاشة تؤدي عملها كاملا بلا صوت.
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setNeedsUnlock(true);
        }
      });
    },
    [settings.audioEnabled, settings.audioVolume],
  );

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  return { needsUnlock, unlock, playFor, stop };
}
