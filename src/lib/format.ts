/** ادوات التنسيق العربية: الارقام والتواريخ والاوقات */

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** يحوّل الارقام اللاتينية الى هندية اذا طُلب ذلك */
export function localizeDigits(input: string, arabic: boolean): string {
  if (!arabic) return input;
  return input.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

export interface TimeParts {
  /** الساعة والدقيقة مثل 5:08 او 17:08 */
  hm: string;
  /** ص او م — فارغ في نظام 24 ساعة */
  suffix: string;
}

/** يقسم وقتا الى ساعة/دقيقة ولاحقة عربية */
export function formatTime(date: Date, use24h: boolean, arabicDigits: boolean): TimeParts {
  const h24 = date.getHours();
  const m = date.getMinutes();
  const mm = String(m).padStart(2, '0');

  if (use24h) {
    return {
      hm: localizeDigits(`${String(h24).padStart(2, '0')}:${mm}`, arabicDigits),
      suffix: '',
    };
  }

  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    hm: localizeDigits(`${h12}:${mm}`, arabicDigits),
    suffix: h24 < 12 ? 'ص' : 'م',
  };
}

/** عدّاد تنازلي بصيغة H:MM:SS او MM:SS */
export function formatCountdown(ms: number, arabicDigits: boolean): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const body =
    h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return localizeDigits(body, arabicDigits);
}

const WEEKDAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/** الثلاثاء 28 يناير 2025 م */
export function formatGregorian(date: Date, arabicDigits: boolean): string {
  const d = localizeDigits(String(date.getDate()), arabicDigits);
  const y = localizeDigits(String(date.getFullYear()), arabicDigits);
  return `${d} ${MONTHS_AR[date.getMonth()]} ${y} م`;
}

export function weekdayAr(date: Date): string {
  return WEEKDAYS_AR[date.getDay()];
}

/** تاريخ محلي بصيغة YYYY-MM-DD بدون انزلاق المنطقة الزمنية */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
