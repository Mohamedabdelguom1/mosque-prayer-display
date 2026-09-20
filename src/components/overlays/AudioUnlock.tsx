/** لافتة تظهر مرة واحدة لفكّ قفل التشغيل التلقائي في المتصفح */
export function AudioUnlock({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="unlock" onClick={onUnlock} role="button" tabIndex={0}>
      <div className="unlock__title">اضغط لتفعيل صوت الأذان</div>
      <div className="unlock__msg">
        المتصفح يمنع تشغيل الصوت قبل أول تفاعل. اضغط في أي مكان مرة واحدة فقط.
        <br />
        في وضع العرض الدائم (Kiosk) لن تظهر هذه الرسالة.
      </div>
    </div>
  );
}
