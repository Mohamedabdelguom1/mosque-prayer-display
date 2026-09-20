import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startBurnInProtection } from './burnIn';

/**
 * نستبدل ما تلمسه الدالة فقط من واجهات المتصفح بدل جلب بيئة DOM كاملة:
 * خاصية style على عنصر الجذر، ومؤقّتات window.
 */
let props: Record<string, string>;

beforeEach(() => {
  vi.useFakeTimers();
  props = {};

  vi.stubGlobal('document', {
    documentElement: {
      style: {
        setProperty: (k: string, v: string) => {
          props[k] = v;
        },
      },
    },
  });

  vi.stubGlobal('window', {
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const offset = () => `${props['--burn-x']},${props['--burn-y']}`;

describe('startBurnInProtection', () => {
  it('يضبط ازاحة صفرية فور البدء', () => {
    startBurnInProtection();
    expect(offset()).toBe('0px,0px');
  });

  it('يزيح الشاشة بعد اربع دقائق', () => {
    startBurnInProtection();
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(offset()).not.toBe('0px,0px');
  });

  it('الازاحة تبقى صغيرة فلا تُلحظ ولا تكشف حواف الشاشة', () => {
    startBurnInProtection();
    for (let i = 0; i < 12; i++) {
      vi.advanceTimersByTime(4 * 60 * 1000);
      const x = parseInt(props['--burn-x'], 10);
      const y = parseInt(props['--burn-y'], 10);
      expect(Math.abs(x)).toBeLessThanOrEqual(6);
      expect(Math.abs(y)).toBeLessThanOrEqual(6);
    }
  });

  it('يمرّ بمواضع متعددة ثم يدور، فلا يثبت على موضع واحد', () => {
    startBurnInProtection();
    const seen = new Set<string>([offset()]);
    for (let i = 0; i < 8; i++) {
      vi.advanceTimersByTime(4 * 60 * 1000);
      seen.add(offset());
    }
    expect(seen.size).toBe(9);

    // الدورة التاسعة تعود لنقطة البداية
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(offset()).toBe('0px,0px');
  });

  it('الايقاف ينظّف المؤقّت ويعيد الازاحة صفرا', () => {
    const stop = startBurnInProtection();
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(offset()).not.toBe('0px,0px');

    stop();
    expect(offset()).toBe('0px,0px');
    expect(vi.getTimerCount()).toBe(0);

    // لا مزيد من التحديثات بعد الايقاف — لا مؤقّت متسرّب
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(offset()).toBe('0px,0px');
  });
});
