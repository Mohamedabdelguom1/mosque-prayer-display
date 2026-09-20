/**
 * نمط التحرير بالريموت على Android TV.
 *
 * السبب: بمجرد وصول البؤرة الى حقل نص يفتح النظام لوحة المفاتيح،
 * فتبتلع هي كل مفاتيح الاتجاه ولا يصل الى الصفحة شيء، فيعلق المشرف
 * داخل الحقل ولا يخرج منه. ولا ينفع علاج ذلك من داخل الصفحة.
 *
 * الحل: الحقل نفسه لا يستقبل البؤرة اصلا. البؤرة تقع على "صف"
 * يحيط به، والتنقّل يجري بين الصفوف. وعند الضغط على OK يدخل الصف
 * وضع التحرير فتنتقل البؤرة الى الحقل الحقيقي وتُفتح لوحة المفاتيح،
 * ويخرج منه بزر الرجوع.
 */

export type RowKind = 'text' | 'number' | 'textarea' | 'select' | 'check' | 'button';

export type RowAction =
  | { type: 'navigate'; dir: 1 | -1 }
  | { type: 'enter-edit' }
  | { type: 'toggle' }
  | { type: 'activate' }
  | { type: 'adjust'; delta: 1 | -1 }
  | { type: 'none' };

const OK_KEYS = new Set(['Enter', 'NumpadEnter', ' ', 'Spacebar']);
const BACK_KEYS = new Set(['Escape', 'Backspace', 'GoBack', 'BrowserBack']);

export const isBackKey = (key: string): boolean => BACK_KEYS.has(key);

/** ما يفعله المفتاح وصفٌ غيرُ محرَّر، اي والبؤرة على الصف لا داخل الحقل */
export function rowAction(key: string, kind: RowKind): RowAction {
  if (key === 'ArrowUp') return { type: 'navigate', dir: -1 };
  if (key === 'ArrowDown') return { type: 'navigate', dir: 1 };

  // الارقام تُضبط من الصف مباشرة بلا دخول وضع التحرير،
  // فلا حاجة للوحة مفاتيح لضبط فرق اقامة او تعديل دقائق
  if (kind === 'number') {
    if (key === 'ArrowRight') return { type: 'adjust', delta: 1 };
    if (key === 'ArrowLeft') return { type: 'adjust', delta: -1 };
  }

  if (OK_KEYS.has(key)) {
    if (kind === 'check') return { type: 'toggle' };
    if (kind === 'button') return { type: 'activate' };
    return { type: 'enter-edit' };
  }

  return { type: 'none' };
}

/**
 * ما يفعله المفتاح والصف في وضع التحرير.
 * كل ما عدا الخروج يُترك للحقل نفسه ولوحة المفاتيح.
 */
export function editAction(key: string, kind: RowKind): 'exit' | 'none' {
  if (isBackKey(key)) return 'exit';

  // في حقل سطر واحد يُنهي OK التحرير ايضا، وهو المتوقع.
  // اما منطقة النص المتعدّد فـ OK فيها سطر جديد، فلا تُنهى الا بالرجوع.
  if (OK_KEYS.has(key) && kind !== 'textarea') return 'exit';

  return 'none';
}
