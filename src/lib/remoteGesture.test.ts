import { describe, expect, it } from 'vitest';
import { GESTURE_COUNT, GESTURE_WINDOW_MS, isOkKey, pushPress } from './remoteGesture';

/** ينفّذ سلسلة ضغطات بفواصل زمنية ويرجع عدد مرات اكتمال الايماءة */
function run(gaps: number[]): number {
  let presses: number[] = [];
  let t = 0;
  let fired = 0;
  for (const gap of gaps) {
    t += gap;
    const r = pushPress(presses, t);
    presses = r.presses;
    if (r.triggered) fired++;
  }
  return fired;
}

describe('isOkKey', () => {
  it('يقبل ما يرسله زر OK في متصفحات التلفاز', () => {
    expect(isOkKey('Enter')).toBe(true);
    expect(isOkKey(' ')).toBe(true);
    expect(isOkKey('NumpadEnter')).toBe(true);
  });

  it('يتجاهل مفاتيح الاتجاه فالتنقل لا يفتح الاعدادات', () => {
    expect(isOkKey('ArrowUp')).toBe(false);
    expect(isOkKey('ArrowRight')).toBe(false);
    expect(isOkKey('Escape')).toBe(false);
  });
});

describe('pushPress', () => {
  it('خمس ضغطات سريعة تفتح الاعدادات', () => {
    expect(run([0, 200, 200, 200, 200])).toBe(1);
  });

  it('اربع ضغطات لا تكفي', () => {
    expect(run([0, 200, 200, 200])).toBe(0);
  });

  it('ضغطات متباعدة لا تُحتسب ولو بلغت العدد', () => {
    // كل ضغطة بعد انقضاء النافذة، فلا يجتمع منها شيء
    const gap = GESTURE_WINDOW_MS + 500;
    expect(run([0, gap, gap, gap, gap, gap, gap])).toBe(0);
  });

  it('الضغطات القديمة تسقط من النافذة', () => {
    let presses: number[] = [];
    // ضغطتان قديمتان ثم توقّف طويل ثم اربع سريعة = لا اكتمال
    for (const t of [0, 100]) presses = pushPress(presses, t).presses;
    let fired = 0;
    for (const t of [5000, 5100, 5200, 5300]) {
      const r = pushPress(presses, t);
      presses = r.presses;
      if (r.triggered) fired++;
    }
    expect(fired).toBe(0);
  });

  it('يفرّغ السجل بعد الاكتمال فلا تنفتح مرتين بضغطة واحدة زائدة', () => {
    let presses: number[] = [];
    let fired = 0;
    for (let i = 0; i < GESTURE_COUNT; i++) {
      const r = pushPress(presses, i * 100);
      presses = r.presses;
      if (r.triggered) fired++;
    }
    expect(fired).toBe(1);
    expect(presses).toEqual([]);

    const after = pushPress(presses, GESTURE_COUNT * 100);
    expect(after.triggered).toBe(false);
  });

  it('عشر ضغطات متتالية تفتحها مرتين لا اكثر', () => {
    expect(run(Array.from({ length: 10 }, (_, i) => (i === 0 ? 0 : 150)))).toBe(2);
  });
});
