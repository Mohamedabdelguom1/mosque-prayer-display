import { useEffect, useState } from 'react';
import type { Ayah } from '../../types';

/** يبدّل الآيات بتلاش متبادل كل عدد محدّد من الثواني */
export function AyahRotator({ ayat, seconds }: { ayat: Ayah[]; seconds: number }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (ayat.length <= 1) return;

    const cycle = window.setInterval(() => {
      setLeaving(true);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % ayat.length);
        setLeaving(false);
      }, 240); // يطابق مدة حركة الخروج
    }, Math.max(5, seconds) * 1000);

    return () => window.clearInterval(cycle);
  }, [ayat.length, seconds]);

  const ayah = ayat[index] ?? ayat[0];
  if (!ayah) return <div className="ayah" />;

  return (
    <div className="ayah">
      <div className={leaving ? 'ayah--out' : 'ayah--in'} key={index}>
        <div className="ayah__text">
          {'{ '}
          {ayah.text}
          {' }'}
        </div>
        <div className="ayah__source">({ayah.source})</div>
      </div>
    </div>
  );
}
