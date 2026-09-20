import { describe, expect, it } from 'vitest';
import { navIntent, stepIndex, type FieldState } from './spatialNav';

const f = (kind: FieldState['kind'], extra: Partial<FieldState> = {}): FieldState => ({
  kind,
  ...extra,
});

describe('navIntent', () => {
  it('الاعلى والاسفل ينقلان بين الحقول في حقل نص عادي', () => {
    expect(navIntent('ArrowUp', f('text'))).toBe('prev');
    expect(navIntent('ArrowDown', f('text'))).toBe('next');
  });

  it('لا يعلق المستخدم في حقل نص: الاسهم الراسية تخرج منه دائما', () => {
    // هذا جوهر الشكوى — كانت مربعات الكتابة تعترض الحركة
    expect(navIntent('ArrowDown', f('text'))).not.toBe('native');
    expect(navIntent('ArrowUp', f('select'))).toBe('prev');
    expect(navIntent('ArrowDown', f('other'))).toBe('next');
  });

  it('منطقة النص المتعدّد تحتفظ بالحركة حتى تبلغ طرفها', () => {
    expect(navIntent('ArrowUp', f('textarea', { atStart: false }))).toBe('native');
    expect(navIntent('ArrowDown', f('textarea', { atEnd: false }))).toBe('native');
  });

  it('وعند الطرف تخرج البؤرة من منطقة النص', () => {
    expect(navIntent('ArrowUp', f('textarea', { atStart: true }))).toBe('prev');
    expect(navIntent('ArrowDown', f('textarea', { atEnd: true }))).toBe('next');
  });

  it('الاسهم الافقية تضبط الارقام بلا لوحة مفاتيح', () => {
    expect(navIntent('ArrowLeft', f('number'))).toBe('decrease');
    expect(navIntent('ArrowRight', f('number'))).toBe('increase');
  });

  it('وفي غير الارقام تُترك الاسهم الافقية لتحريك مؤشر الكتابة', () => {
    expect(navIntent('ArrowLeft', f('text'))).toBe('native');
    expect(navIntent('ArrowRight', f('textarea'))).toBe('native');
    expect(navIntent('ArrowLeft', f('select'))).toBe('native');
  });

  it('بقية المفاتيح لا تُعترض', () => {
    expect(navIntent('Enter', f('text'))).toBe('native');
    expect(navIntent('Backspace', f('number'))).toBe('native');
  });
});

describe('stepIndex', () => {
  it('يتقدّم ويتراجع', () => {
    expect(stepIndex(5, 2, 1)).toBe(3);
    expect(stepIndex(5, 2, -1)).toBe(1);
  });

  it('يقف عند الطرفين بلا التفاف', () => {
    // الالتفاف على التلفاز مربك: تضغط اسفل فتقفز البؤرة الى اعلى اللوحة
    expect(stepIndex(5, 4, 1)).toBe(4);
    expect(stepIndex(5, 0, -1)).toBe(0);
  });

  it('يتعامل مع قائمة فارغة', () => {
    expect(stepIndex(0, 0, 1)).toBe(-1);
  });
});
