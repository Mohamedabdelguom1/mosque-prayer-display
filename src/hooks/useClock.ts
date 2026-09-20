import { useEffect, useState } from 'react';

/**
 * المصدر الوحيد للوقت في التطبيق.
 *
 * مؤقّت واحد يوزّع اللحظة على كل المكوّنات بدل مؤقّت لكل مكوّن،
 * وهذا فارق ملموس في الاداء على جهاز العرض الصغير.
 *
 * وضع الاختبار: ?mock=HH:MM يزيح ساعة التطبيق الى وقت محدّد
 * لاختبار تسلسل الاذان والاقامة وعبور منتصف الليل بلا انتظار حقيقي.
 */

function readMockOffset(): number {
  if (typeof window === 'undefined') return 0;
  const raw = new URLSearchParams(window.location.search).get('mock');
  if (!raw) return 0;

  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw.trim());
  if (!m) return 0;

  const target = new Date();
  target.setHours(Number(m[1]), Number(m[2]), Number(m[3] ?? 0), 0);
  return target.getTime() - Date.now();
}

/** الازاحة ثابتة طوال الجلسة حتى يستمر الوقت في التقدم بشكل طبيعي */
const MOCK_OFFSET = readMockOffset();

export const isMockMode = MOCK_OFFSET !== 0;

/** اللحظة الحالية كما يراها التطبيق */
export function appNow(): Date {
  return new Date(Date.now() + MOCK_OFFSET);
}

export function useClock(): Date {
  const [now, setNow] = useState(appNow);

  useEffect(() => {
    let timer = 0;

    // نضبط اول نبضة على بداية الثانية التالية حتى لا تتأخر الساعة
    const schedule = () => {
      const delay = 1000 - (appNow().getTime() % 1000);
      timer = window.setTimeout(() => {
        setNow(appNow());
        schedule();
      }, delay);
    };

    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  return now;
}
