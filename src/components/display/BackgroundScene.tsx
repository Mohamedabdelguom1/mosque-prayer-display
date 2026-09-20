import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  images: string[];
  seconds: number;
}

const FALLBACK = './bg/mosque.svg';

/**
 * خلفيات تتناوب بتلاش متبادل، مع حركة Ken Burns بطيئة جدا.
 *
 * الطبقتان ثابتتان في الشجرة ولا تحملان key متغيّرا:
 * لو أعاد React انشاءهما في كل دورة لظهر عنصر جديد بشفافية نهائية مباشرة
 * فلا ينفّذ المتصفح انتقال الشفافية اصلا، وتقفز الصورة بدل ان تتلاشى.
 *
 * ولا نرسم الا طبقتين مهما بلغ عدد الصور، لان كل صورة 1920x1080
 * مفكوكة الضغط تكلّف نحو 8 ميغابايت من ذاكرة جهاز العرض.
 */
export function BackgroundScene({ images, seconds }: Props) {
  const list = useMemo(
    () => (images.length > 0 ? images : [FALLBACK]),
    // المقارنة بالمحتوى لا بهوية المصفوفة، حتى لا تُعاد الدورة مع كل رسم
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images.join('|')],
  );

  const [slots, setSlots] = useState<[string, string]>([list[0], '']);
  const [active, setActive] = useState<0 | 1>(0);

  const activeRef = useRef<0 | 1>(0);
  activeRef.current = active;

  // اذا تغيّرت القائمة من الاعدادات نعيد البدء من اول صورة
  useEffect(() => {
    setSlots([list[0], '']);
    setActive(0);
  }, [list]);

  useEffect(() => {
    if (list.length <= 1) return;

    let index = 0;

    const advance = () => {
      index = (index + 1) % list.length;
      const src = list[index];

      // لا نبدأ التلاشي الا بعد اكتمال تحميل الصورة، والا ظهر اطار فارغ
      const swap = () => {
        const target = activeRef.current === 0 ? 1 : 0;
        setSlots((prev) => {
          const next: [string, string] = [prev[0], prev[1]];
          next[target] = src;
          return next;
        });
        setActive(target);
      };

      const preload = new Image();
      preload.onload = swap;
      preload.onerror = swap; // صورة مفقودة لا توقف الدورة
      preload.src = src;
    };

    const timer = window.setInterval(advance, Math.max(15, seconds) * 1000);
    return () => window.clearInterval(timer);
  }, [list, seconds]);

  return (
    <div className="bg">
      {[0, 1].map((slot) => (
        <div
          key={slot}
          className={`bg__layer${active === slot ? ' bg__layer--on' : ''}`}
          style={slots[slot] ? { backgroundImage: `url("${slots[slot]}")` } : undefined}
        />
      ))}
      <div className="bg__scrim" />
    </div>
  );
}
