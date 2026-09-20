import { useEffect, useState } from 'react';

interface Props {
  images: string[];
  seconds: number;
}

const FALLBACK = ['./bg/mosque.svg'];

interface BgState {
  /** مصدر الصورة لكل طبقة من الطبقتين الثابتتين */
  slots: [string, string];
  /** ايّ الطبقتين ظاهرة الآن */
  active: 0 | 1;
}

const initialState = (first: string): BgState => ({ slots: [first, ''], active: 0 });

/**
 * خلفيات تتناوب بتلاش متبادل، مع حركة Ken Burns بطيئة جدا.
 *
 * الطبقتان ثابتتان في الشجرة ولا تحملان key متغيّرا:
 * لو أعاد React انشاءهما في كل دورة لظهر عنصر جديد بشفافيته النهائية مباشرة
 * فلا ينفّذ المتصفح انتقال الشفافية اصلا، وتقفز الصورة بدل ان تتلاشى.
 *
 * ولا نرسم الا طبقتين مهما بلغ عدد الصور، لان كل صورة 1920x1080
 * مفكوكة الضغط تكلّف نحو 8 ميغابايت من ذاكرة جهاز العرض.
 */
export function BackgroundScene({ images, seconds }: Props) {
  const list = images.length > 0 ? images : FALLBACK;
  const key = list.join('|');

  const [state, setState] = useState<BgState>(() => initialState(list[0]));

  // تبدّلت قائمة الخلفيات من الاعدادات: نعيد البدء من اول صورة.
  // الضبط اثناء الرسم هو النمط الذي يوصي به React لمزامنة الحالة مع تغيّر الخصائص،
  // وهو افضل من setState داخل useEffect لانه لا يسبب رسمة وسيطة بحالة قديمة.
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setState(initialState(list[0]));
  }

  useEffect(() => {
    const sources = key.split('|');
    if (sources.length <= 1) return;

    let index = 0;

    const timer = window.setInterval(
      () => {
        index = (index + 1) % sources.length;
        const src = sources[index];

        const swap = () =>
          setState((prev) => {
            const target: 0 | 1 = prev.active === 0 ? 1 : 0;
            const slots: [string, string] = [prev.slots[0], prev.slots[1]];
            slots[target] = src;
            return { slots, active: target };
          });

        // لا نبدأ التلاشي الا بعد اكتمال تحميل الصورة، والا ظهر اطار فارغ
        const preload = new Image();
        preload.onload = swap;
        preload.onerror = swap; // صورة مفقودة لا توقف الدورة
        preload.src = src;
      },
      Math.max(15, seconds) * 1000,
    );

    return () => window.clearInterval(timer);
  }, [key, seconds]);

  return (
    <div className="bg">
      {([0, 1] as const).map((slot) => (
        <div
          key={slot}
          className={`bg__layer${state.active === slot ? ' bg__layer--on' : ''}`}
          style={
            state.slots[slot] ? { backgroundImage: `url("${state.slots[slot]}")` } : undefined
          }
        />
      ))}
      <div className="bg__scrim" />
    </div>
  );
}
