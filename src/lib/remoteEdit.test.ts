import { describe, expect, it } from 'vitest';
import { editAction, isBackKey, rowAction, type RowKind } from './remoteEdit';

describe('rowAction — والبؤرة على الصف', () => {
  const kinds: RowKind[] = ['text', 'number', 'textarea', 'select', 'check', 'button'];

  it('الاسهم الراسية تنقل بين الصفوف مهما كان نوع الحقل', () => {
    // هذا جوهر الشكوى: الحقل لم يعد يعترض الحركة لانه لا يملك البؤرة
    for (const kind of kinds) {
      expect(rowAction('ArrowUp', kind)).toEqual({ type: 'navigate', dir: -1 });
      expect(rowAction('ArrowDown', kind)).toEqual({ type: 'navigate', dir: 1 });
    }
  });

  it('OK يدخل وضع التحرير في حقول الكتابة', () => {
    expect(rowAction('Enter', 'text')).toEqual({ type: 'enter-edit' });
    expect(rowAction('Enter', 'textarea')).toEqual({ type: 'enter-edit' });
    expect(rowAction('Enter', 'select')).toEqual({ type: 'enter-edit' });
  });

  it('OK يقلب مربع الاختيار مباشرة بلا وضع تحرير', () => {
    expect(rowAction('Enter', 'check')).toEqual({ type: 'toggle' });
  });

  it('OK يضغط الزر', () => {
    expect(rowAction(' ', 'button')).toEqual({ type: 'activate' });
  });

  it('الارقام تُضبط من الصف بلا لوحة مفاتيح', () => {
    expect(rowAction('ArrowRight', 'number')).toEqual({ type: 'adjust', delta: 1 });
    expect(rowAction('ArrowLeft', 'number')).toEqual({ type: 'adjust', delta: -1 });
  });

  it('وفي غير الارقام لا تفعل الاسهم الافقية شيئا على الصف', () => {
    expect(rowAction('ArrowRight', 'text')).toEqual({ type: 'none' });
    expect(rowAction('ArrowLeft', 'textarea')).toEqual({ type: 'none' });
  });
});

describe('editAction — وداخل وضع التحرير', () => {
  it('زر الرجوع يخرج من الحقل', () => {
    expect(editAction('Escape', 'text')).toBe('exit');
    expect(editAction('Escape', 'textarea')).toBe('exit');
  });

  it('OK ينهي التحرير في حقل السطر الواحد', () => {
    expect(editAction('Enter', 'text')).toBe('exit');
    expect(editAction('Enter', 'number')).toBe('exit');
  });

  it('لكنه سطر جديد داخل منطقة النص المتعدّد فلا يُنهيها', () => {
    expect(editAction('Enter', 'textarea')).toBe('none');
  });

  it('بقية المفاتيح تُترك للحقل ولوحة المفاتيح', () => {
    expect(editAction('ArrowDown', 'text')).toBe('none');
    expect(editAction('a', 'text')).toBe('none');
  });
});

describe('isBackKey', () => {
  it('يتعرّف على صور زر الرجوع في متصفحات التلفاز', () => {
    expect(isBackKey('Escape')).toBe(true);
    expect(isBackKey('Backspace')).toBe(true);
    expect(isBackKey('Enter')).toBe(false);
  });
});
