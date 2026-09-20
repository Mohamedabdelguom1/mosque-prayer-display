/**
 * حماية الشاشة من الحرق.
 *
 * شاشة تعرض نفس التخطيط 24 ساعة يوميا تحرق البكسلات الثابتة.
 * الحل: ازاحة الجذر بضعة بكسلات كل بضع دقائق بحركة بطيئة غير ملحوظة.
 */

const SHIFT_PX = 6;
const INTERVAL_MS = 4 * 60 * 1000;

const OFFSETS: Array<[number, number]> = [
  [0, 0],
  [SHIFT_PX, 0],
  [SHIFT_PX, SHIFT_PX],
  [0, SHIFT_PX],
  [-SHIFT_PX, SHIFT_PX],
  [-SHIFT_PX, 0],
  [-SHIFT_PX, -SHIFT_PX],
  [0, -SHIFT_PX],
  [SHIFT_PX, -SHIFT_PX],
];

export function startBurnInProtection(): () => void {
  let index = 0;

  const apply = () => {
    const [x, y] = OFFSETS[index % OFFSETS.length];
    document.documentElement.style.setProperty('--burn-x', `${x}px`);
    document.documentElement.style.setProperty('--burn-y', `${y}px`);
    index++;
  };

  apply();
  const timer = window.setInterval(apply, INTERVAL_MS);

  return () => {
    window.clearInterval(timer);
    document.documentElement.style.setProperty('--burn-x', '0px');
    document.documentElement.style.setProperty('--burn-y', '0px');
  };
}
