/**
 * لافتة تظهر مرة واحدة لفكّ قفل التشغيل التلقائي في المتصفح.
 *
 * عنصر button حقيقي لا div بدور button: ريموت التلفاز يرسل Enter
 * ولا يولّد نقرة، فالزر الحقيقي وحده يستجيب له تلقائيا.
 */
export function AudioUnlock({ onUnlock }: { onUnlock: () => void }) {
  return (
    <button type="button" className="unlock" onClick={onUnlock} autoFocus>
      <div className="unlock__title">اضغط لتفعيل صوت الأذان</div>
      <div className="unlock__msg">
        المتصفح يمنع تشغيل الصوت قبل أول تفاعل.
        <br />
        اضغط زر OK في الريموت، أو انقر بالفأرة، مرة واحدة فقط.
        <br />
        في وضع العرض الدائم (Kiosk) لن تظهر هذه الرسالة.
      </div>
    </button>
  );
}
