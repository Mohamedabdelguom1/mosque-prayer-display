import type { Ayah, PrayerKey, Settings } from '../types';

/** اسماء الصلوات بالعربية */
export const PRAYER_NAMES: Record<PrayerKey, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

/** ترتيب الاوقات خلال اليوم */
export const PRAYER_ORDER: PrayerKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

/** طرق الحساب المدعومة في Aladhan — الاكثر استخداما */
export const CALC_METHODS: { id: number; nameAr: string }[] = [
  { id: 4, nameAr: 'أم القرى - مكة المكرمة' },
  { id: 3, nameAr: 'رابطة العالم الإسلامي' },
  { id: 5, nameAr: 'الهيئة المصرية العامة للمساحة' },
  { id: 8, nameAr: 'منطقة الخليج' },
  { id: 9, nameAr: 'الكويت' },
  { id: 10, nameAr: 'قطر' },
  { id: 11, nameAr: 'سنغافورة' },
  { id: 12, nameAr: 'الاتحاد الإسلامي الفرنسي' },
  { id: 13, nameAr: 'ديانت - تركيا' },
  { id: 15, nameAr: 'مونستر - أمريكا الشمالية' },
  { id: 2, nameAr: 'الجمعية الإسلامية لأمريكا الشمالية' },
  { id: 1, nameAr: 'الجامعة الإسلامية - كراتشي' },
  { id: 0, nameAr: 'جامعة العلوم الإسلامية - شهيد' },
];

export const DEFAULT_AYAT: Ayah[] = [
  {
    text: 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ',
    source: 'سورة العنكبوت: 45',
  },
  {
    text: 'حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ',
    source: 'سورة البقرة: 238',
  },
  {
    text: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ',
    source: 'سورة البقرة: 43',
  },
  {
    text: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
    source: 'سورة النساء: 103',
  },
  {
    text: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ',
    source: 'سورة المؤمنون: 1-2',
  },
  {
    text: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    source: 'سورة البقرة: 45',
  },
];

export const DEFAULT_MARQUEE: string[] = [
  'اللهم اجعلنا من المحافظين على الصلاة في أوقاتها',
  'طريقك إلى السعادة .. الصلاة',
  'قال ﷺ: الصلاة على وقتها أحب الأعمال إلى الله',
  'سوّوا صفوفكم فإن تسوية الصف من تمام الصلاة',
  'أغلق جوالك احتراماً لبيت الله',
  'من قال حين يسمع النداء: اللهم رب هذه الدعوة التامة .. حلّت له الشفاعة',
];

/**
 * خلفيات اسلامية تتناوب. كلها صور بتراخيص حرة محفوظة محليا
 * في public/bg مع نسبها في CREDITS.json — تفاصيلها في BACKGROUNDS.md
 */
export const DEFAULT_BACKGROUNDS: string[] = [
  './bg/mosque-1.webp',
  './bg/mosque-2.webp',
  './bg/mosque-3.webp',
  './bg/mosque-4.webp',
  './bg/mosque-5.webp',
  './bg/mosque-6.webp',
];

/**
 * الاعدادات الافتراضية — الاحداثيات على الرياض.
 * المشرف يغيّرها من لوحة الاعدادات عند اول تركيب.
 */
export const DEFAULT_SETTINGS: Settings = {
  mosqueName: 'مسجد النور',
  tagline: 'مكان يجمعنا على طاعة الله',
  logoDataUrl: '',

  city: 'الرياض',
  latitude: 24.7136,
  longitude: 46.6753,
  method: 4,
  school: 0,

  offsets: { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 },
  iqamaGaps: { Fajr: 20, Dhuhr: 15, Asr: 15, Maghrib: 7, Isha: 12 },

  adhanScreenEnabled: true,
  adhanScreenSeconds: 180,
  iqamaScreenEnabled: true,
  silenceScreenEnabled: true,
  silenceMinutes: 8,

  audioEnabled: true,
  audioVolume: 0.8,

  ayat: DEFAULT_AYAT,
  marqueeMessages: DEFAULT_MARQUEE,
  marqueeSeconds: 45,
  ayahRotateSeconds: 30,

  backgrounds: DEFAULT_BACKGROUNDS,
  backgroundRotateSeconds: 90,
  use24h: false,
  arabicNumerals: false,
  sideBannerLine1: 'الصلاة',
  sideBannerLine2: 'نورٌ لحياتك',
  burnInProtection: true,
};

/** مفتاح تخزين الاعدادات */
export const SETTINGS_KEY = 'mosque-display:settings:v1';

/**
 * ترتيب العرض على الشاشة يختلف عن الترتيب الزمني.
 * في التصميم المرجعي يقع الشروق في اقصى اليمين كعنصر ثانوي،
 * ثم تتوالى الصلوات الخمس من اليمين الى اليسار: الفجر ثم الظهر ... ثم العشاء.
 */
export const DISPLAY_ORDER: PrayerKey[] = [
  'Sunrise',
  'Fajr',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];
