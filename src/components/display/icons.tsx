/** ايقونات SVG مضمّنة — لا طلبات شبكة ولا مكتبة ايقونات */

interface IconProps {
  className?: string;
}

/** هلال لصلاة العشاء */
export const MoonIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5a8.5 8.5 0 1 0 11.3 11.3Z"
      fill="currentColor"
    />
  </svg>
);

/** شمس كاملة لصلاة الظهر */
export const SunIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.6" fill="currentColor" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <rect
        key={deg}
        x="11.2"
        y="1.4"
        width="1.6"
        height="3.4"
        rx="0.8"
        fill="currentColor"
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
  </svg>
);

/** شمس فوق الافق لصلاة الفجر والشروق */
export const SunriseIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6.5 16a5.5 5.5 0 0 1 11 0Z" fill="currentColor" />
    <rect x="2" y="17.6" width="20" height="1.8" rx="0.9" fill="currentColor" />
    {[-60, -30, 0, 30, 60].map((deg) => (
      <rect
        key={deg}
        x="11.3"
        y="1.6"
        width="1.4"
        height="3"
        rx="0.7"
        fill="currentColor"
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
  </svg>
);

/** شمس مائلة لصلاة العصر */
export const AfternoonIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="13" r="4.2" fill="currentColor" />
    {[-70, -35, 0, 35, 70].map((deg) => (
      <rect
        key={deg}
        x="11.3"
        y="2.4"
        width="1.4"
        height="3.2"
        rx="0.7"
        fill="currentColor"
        transform={`rotate(${deg} 12 13)`}
      />
    ))}
    <rect x="3" y="19.4" width="18" height="1.6" rx="0.8" fill="currentColor" opacity="0.7" />
  </svg>
);

/** شمس غاربة لصلاة المغرب */
export const SunsetIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 15.4a5 5 0 0 1 10 0Z" fill="currentColor" />
    <rect x="2" y="16.8" width="20" height="1.7" rx="0.85" fill="currentColor" />
    <rect x="4.5" y="20" width="15" height="1.5" rx="0.75" fill="currentColor" opacity="0.55" />
    <path
      d="M12 6.4V3.2M8 7.6 6.4 5.4M16 7.6l1.6-2.2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** الكعبة لاتجاه القبلة */
export const KaabaIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.4 21 6v12l-9 3.6L3 18V6l9-3.6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M3 6l9 3.6L21 6M12 9.6v12" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="3.4" y="10.6" width="17.2" height="2.2" fill="currentColor" opacity="0.85" transform="rotate(-6 12 11.7)" />
  </svg>
);

/** محراب لعدّاد الصلاة القادمة */
export const MihrabIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 21V11a6 6 0 0 1 12 0v10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path d="M4 21h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 2.2v2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="12" cy="1.6" r="1.1" fill="currentColor" />
  </svg>
);

/** تقويم لعدّاد رمضان */
export const CalendarIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2.4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 9.6h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {[0, 1, 2].flatMap((row) =>
      [0, 1, 2].map((col) => (
        <rect
          key={`${row}-${col}`}
          x={6.6 + col * 4}
          y={12 + row * 2.6}
          width="2.1"
          height="1.5"
          rx="0.4"
          fill="currentColor"
          opacity="0.75"
        />
      )),
    )}
  </svg>
);

/** شعار المسجد الافتراضي */
export const MosqueLogo = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M32 9c4.6 3.4 7.4 7.4 7.4 11.6 0 4-3.3 6.6-7.4 6.6s-7.4-2.6-7.4-6.6C24.6 16.4 27.4 12.4 32 9Z" fill="currentColor" />
    <path d="M31 3.6c.6-.9 1.4-.9 2 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="32" cy="4.4" r="1.6" fill="currentColor" />
    <path d="M14 27.4c2.9 2.2 4.7 4.8 4.7 7.5 0 2.6-2.1 4.3-4.7 4.3s-4.7-1.7-4.7-4.3c0-2.7 1.8-5.3 4.7-7.5Z" fill="currentColor" opacity="0.85" />
    <path d="M50 27.4c2.9 2.2 4.7 4.8 4.7 7.5 0 2.6-2.1 4.3-4.7 4.3s-4.7-1.7-4.7-4.3c0-2.7 1.8-5.3 4.7-7.5Z" fill="currentColor" opacity="0.85" />
    <rect x="10.4" y="38.6" width="7.2" height="19" rx="1.2" fill="currentColor" opacity="0.85" />
    <rect x="46.4" y="38.6" width="7.2" height="19" rx="1.2" fill="currentColor" opacity="0.85" />
    <path d="M20 57.6V38.4c0-6.6 5.4-12 12-12s12 5.4 12 12v19.2H20Z" fill="currentColor" />
    <path d="M28.4 57.6v-9.2a3.6 3.6 0 0 1 7.2 0v9.2" fill="#0f2430" />
    <rect x="7" y="57" width="50" height="3.4" rx="1.4" fill="currentColor" />
  </svg>
);
