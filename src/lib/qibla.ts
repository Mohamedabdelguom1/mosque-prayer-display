/** حساب اتجاه القبلة محليا بمعادلة الدائرة العظمى — بلا طلب شبكة */

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** الزاوية بالدرجات من الشمال باتجاه عقارب الساعة */
export function qiblaBearing(lat: number, lng: number): number {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const dLng = toRad(KAABA_LNG - lng);

  const y = Math.sin(dLng);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}
