/**
 * فتح لوحة الاعدادات من ريموت التلفاز.
 *
 * ريموت Android TV لا يملك Ctrl ولا Shift ولا حروفا، بل مفاتيح اتجاه
 * وزر OK فقط. فنعتمد ايماءة: خمس ضغطات متتالية على OK خلال ثلاث ثوان.
 *
 * خمس ضغطات سريعة لا تقع مصادفة على شاشة معلّقة لا يلمسها احد،
 * وفي الوقت نفسه يسهل على المشرف تنفيذها بلا ادوات.
 */

export const GESTURE_COUNT = 5;
export const GESTURE_WINDOW_MS = 3000;

/** المفاتيح التي يرسلها زر OK في متصفحات التلفاز المختلفة */
const OK_KEYS = new Set(['Enter', 'NumpadEnter', ' ', 'Spacebar']);

export const isOkKey = (key: string): boolean => OK_KEYS.has(key);

export interface GestureResult {
  /** الضغطات الباقية ضمن النافذة الزمنية */
  presses: number[];
  triggered: boolean;
}

/**
 * يضيف ضغطة الى السجل ويقرّر هل اكتملت الايماءة.
 * دالة خالصة: لا تحتفظ بحالة ولا تقرأ الساعة بنفسها.
 */
export function pushPress(presses: number[], at: number): GestureResult {
  const withinWindow = presses.filter((t) => at - t < GESTURE_WINDOW_MS);
  const next = [...withinWindow, at];

  if (next.length >= GESTURE_COUNT) {
    return { presses: [], triggered: true }; // نفرّغ السجل حتى لا تتكرر فورا
  }
  return { presses: next, triggered: false };
}
