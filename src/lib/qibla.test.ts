import { describe, expect, it } from 'vitest';
import { qiblaBearing } from './qibla';

/*
 * القيم المتوقعة محسوبة باستقلال عن تنفيذ المشروع بصيغة الدائرة العظمى،
 * لا منقولة من ذاكرة او من موقع، حتى يكون الاختبار مرجعا حقيقيا.
 */
describe('qiblaBearing', () => {
  it('الرياض تتجه غربا بميل جنوبي', () => {
    expect(qiblaBearing(24.7136, 46.6753)).toBeCloseTo(243.798, 2);
  });

  it('القاهرة تتجه جنوبا بميل شرقي', () => {
    expect(qiblaBearing(30.0444, 31.2357)).toBeCloseTo(136.137, 2);
  });

  it('اسطنبول تتجه جنوبا بميل شرقي', () => {
    expect(qiblaBearing(41.0082, 28.9784)).toBeCloseTo(151.621, 2);
  });

  it('جاكرتا تتجه غربا بميل شمالي', () => {
    expect(qiblaBearing(-6.2088, 106.8456)).toBeCloseTo(295.152, 2);
  });

  it('النتيجة دائما ضمن نطاق 0 الى 360', () => {
    for (const [lat, lng] of [[0, 0], [70, -150], [-40, 170], [60, 39.8262]]) {
      const b = qiblaBearing(lat, lng);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });

  it('من شمال الكعبة على خط طولها يتجه جنوبا تماما', () => {
    expect(qiblaBearing(40, 39.8262)).toBeCloseTo(180, 4);
  });
});
