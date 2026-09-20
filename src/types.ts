/** مفاتيح الاوقات الستة كما تسميها Aladhan */
export type PrayerKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

/** الاوقات القابلة للاذان والاقامة — الشروق ليس صلاة */
export type AdhanPrayerKey = Exclude<PrayerKey, 'Sunrise'>;

/** يوم واحد كما يصل من تقويم Aladhan بعد التبسيط */
export interface DayTimings {
  /** التاريخ الميلادي بصيغة YYYY-MM-DD بالتوقيت المحلي للموقع */
  gregorian: string;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthNameAr: string;
    weekdayAr: string;
  };
  /** دقائق منذ منتصف الليل لكل وقت */
  minutes: Record<PrayerKey, number>;
}

/** وقت صلاة محسوب على تاريخ فعلي */
export interface PrayerSlot {
  key: PrayerKey;
  nameAr: string;
  /** لحظة دخول الوقت */
  at: Date;
  /** لحظة الاقامة — undefined للشروق */
  iqamaAt?: Date;
  isPrayer: boolean;
}

/** نتيجة حساب جدول اللحظة الحالية */
export interface ScheduleState {
  /** الصلوات المعروضة على اللوحة — تصير مواقيت الغد بعد انقضاء العشاء */
  today: PrayerSlot[];
  /**
   * صلوات اليوم الميلادي الحالي دائما.
   * شاشات الاذان والاقامة والصمت تعتمد عليها، لان صمت العشاء
   * يمتد الى ما بعد لحظة انتقال اللوحة الى مواقيت الغد.
   */
  todayActual: PrayerSlot[];
  /** الوقت القادم — قد يكون فجر الغد */
  next: PrayerSlot;
  /** الوقت الذي دخل ولم ينته بعد */
  current: PrayerSlot | null;
  /** صحيح عندما تعرض اللوحة مواقيت الغد بعد انقضاء العشاء */
  isNextDay: boolean;
  msUntilNext: number;
}

export type Phase = 'NORMAL' | 'ADHAN' | 'IQAMA' | 'SILENCE';

export interface PhaseState {
  phase: Phase;
  /** الصلاة التي تخص الطبقة الحالية */
  prayer: PrayerSlot | null;
  /** الثواني المتبقية في الطبقة الحالية */
  remainingMs: number;
  /** نسبة التقدم من 0 الى 1 */
  progress: number;
}

export interface Ayah {
  text: string;
  source: string;
}

export interface Settings {
  /* المسجد */
  mosqueName: string;
  tagline: string;
  /** شعار مرفوع كـ data URL — فارغ يعني استخدام الرسم الافتراضي */
  logoDataUrl: string;

  /* الموقع */
  city: string;
  latitude: number;
  longitude: number;
  /** رقم طريقة الحساب في Aladhan */
  method: number;
  /** 0 = شافعي/مالكي/حنبلي، 1 = حنفي */
  school: 0 | 1;

  /* التعديلات بالدقائق */
  offsets: Record<PrayerKey, number>;
  iqamaGaps: Record<AdhanPrayerKey, number>;

  /* الشاشات */
  adhanScreenEnabled: boolean;
  adhanScreenSeconds: number;
  iqamaScreenEnabled: boolean;
  silenceScreenEnabled: boolean;
  silenceMinutes: number;

  /* الصوت */
  audioEnabled: boolean;
  audioVolume: number;

  /* المحتوى */
  ayat: Ayah[];
  marqueeMessages: string[];
  marqueeSeconds: number;
  ayahRotateSeconds: number;

  /* المظهر */
  /** قائمة خلفيات تتناوب بتلاش متبادل */
  backgrounds: string[];
  backgroundRotateSeconds: number;
  use24h: boolean;
  arabicNumerals: boolean;
  sideBannerLine1: string;
  sideBannerLine2: string;
  burnInProtection: boolean;
}

/** ما يحتاجه العرض من نتيجة جلب المواقيت */
export interface PrayerTimesLike {
  schedule: ScheduleState | null;
  today: DayTimings | null;
  stale: boolean;
  clockWrong: boolean;
  clockSkewMs: number | null;
}
