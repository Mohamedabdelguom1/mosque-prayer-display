/**
 * التنقّل في لوحة الاعدادات بريموت التلفاز.
 *
 * المشكلة: داخل حقل كتابة تبتلع الاسهم الحركة لتحريك مؤشر الكتابة،
 * فيعلق المستخدم في الحقل ولا يستطيع الخروج منه بالريموت.
 *
 * القاعدة: الاعلى والاسفل ينقلان بين الحقول دائما، الا داخل منطقة
 * نص متعدّد الاسطر فيتحرك المؤشر حتى يبلغ طرفها ثم ينتقل.
 * واليمين واليسار يزيدان وينقصان قيم الارقام بلا لوحة مفاتيح.
 */

export type FieldKind = 'number' | 'text' | 'textarea' | 'select' | 'other';

export interface FieldState {
  kind: FieldKind;
  /** مؤشر الكتابة عند بداية النص — يخصّ مناطق النص فقط */
  atStart?: boolean;
  /** مؤشر الكتابة عند نهاية النص */
  atEnd?: boolean;
}

export type NavIntent = 'prev' | 'next' | 'decrease' | 'increase' | 'native';

export function navIntent(key: string, field: FieldState): NavIntent {
  switch (key) {
    case 'ArrowUp':
      // داخل نص متعدّد الاسطر ندع المؤشر يصعد حتى يبلغ اوله
      if (field.kind === 'textarea' && !field.atStart) return 'native';
      return 'prev';

    case 'ArrowDown':
      if (field.kind === 'textarea' && !field.atEnd) return 'native';
      return 'next';

    case 'ArrowLeft':
      // في عنصر الرقم نجعل الاسهم الافقية تضبط القيمة،
      // فلوحة المفاتيح على التلفاز عناء لا داعي له
      return field.kind === 'number' ? 'decrease' : 'native';

    case 'ArrowRight':
      return field.kind === 'number' ? 'increase' : 'native';

    default:
      return 'native';
  }
}

/** الفهرس التالي بلا التفاف، حتى لا تقفز البؤرة من آخر اللوحة الى اولها */
export function stepIndex(count: number, current: number, dir: 1 | -1): number {
  if (count === 0) return -1;
  const next = current + dir;
  if (next < 0) return 0;
  if (next >= count) return count - 1;
  return next;
}

/** يستنتج نوع الحقل من عنصر DOM */
export function fieldKindOf(el: HTMLElement): FieldKind {
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea') return 'textarea';
  if (tag === 'select') return 'select';
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type;
    if (type === 'number') return 'number';
    if (type === 'checkbox' || type === 'radio' || type === 'file') return 'other';
    return 'text';
  }
  return 'other';
}
