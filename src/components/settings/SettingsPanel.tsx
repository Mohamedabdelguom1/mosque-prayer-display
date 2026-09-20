import { useEffect, useRef, useState } from 'react';
import type { AdhanPrayerKey, PrayerKey, Settings } from '../../types';
import {
  CALC_METHODS,
  DEFAULT_SETTINGS,
  PRAYER_NAMES,
  PRAYER_ORDER,
} from '../../config/defaults';
import { useSettings } from '../../hooks/settingsContext';
import { CheckField, Section, SelectField, TextField, TextareaField } from './fields';
import { fieldKindOf, navIntent, stepIndex } from '../../lib/spatialNav';

const IQAMA_KEYS: AdhanPrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const num = (v: string, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, update, replace, reset } = useSettings();
  const [flash, setFlash] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // المؤشر مخفي على شاشة العرض — نعيده داخل اللوحة
  useEffect(() => {
    document.body.classList.add('has-cursor');
    return () => document.body.classList.remove('has-cursor');
  }, []);

  /*
   * التنقّل بالريموت: بلا هذا تبتلع حقول الكتابة الاسهم لتحريك مؤشرها
   * فيعلق المشرف داخل الحقل ولا يخرج منه، وهي شكوى واقعية من الجهاز.
   */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const kind = fieldKindOf(el);

    let atStart: boolean | undefined;
    let atEnd: boolean | undefined;
    if (kind === 'textarea') {
      const ta = el as HTMLTextAreaElement;
      atStart = ta.selectionStart === 0;
      atEnd = ta.selectionEnd === ta.value.length;
    }

    const intent = navIntent(e.key, { kind, atStart, atEnd });
    if (intent === 'native') return;

    e.preventDefault();

    if (intent === 'increase' || intent === 'decrease') {
      const input = el as HTMLInputElement;
      if (intent === 'increase') input.stepUp();
      else input.stepDown();
      // stepUp لا يُطلق حدث input، فنُطلقه يدويا ليصل التغيير الى React
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    const items = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(
        'input:not([type="file"]), select, textarea, button',
      ) ?? [],
    ).filter((n) => !n.hasAttribute('disabled') && n.offsetParent !== null);

    const current = items.indexOf(el);
    const target = items[stepIndex(items.length, current, intent === 'next' ? 1 : -1)];
    if (target) {
      target.focus();
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  const notify = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(''), 1800);
  };

  const setOffset = (key: PrayerKey, value: string) =>
    update({ offsets: { ...settings.offsets, [key]: num(value, 0) } });

  const setGap = (key: AdhanPrayerKey, value: string) =>
    update({ iqamaGaps: { ...settings.iqamaGaps, [key]: num(value, 0) } });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mosque-display-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<Settings>;
        replace({ ...DEFAULT_SETTINGS, ...parsed });
        notify('تم استيراد الإعدادات');
      } catch {
        notify('الملف غير صالح');
      }
    };
    reader.readAsText(file);
  };

  const importLogo = (file: File) => {
    if (file.size > 400_000) {
      notify('الشعار كبير — استخدم صورة أصغر من 400 كيلوبايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update({ logoDataUrl: String(reader.result) });
      notify('تم رفع الشعار');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="settings" ref={rootRef} onKeyDown={onKeyDown}>
      <div className="settings__remote-hint">
        ▲▼ للتنقّل &nbsp;·&nbsp; ◀▶ لتغيير الأرقام &nbsp;·&nbsp; رجوع للخروج
      </div>

      <header className="settings__head">
        <div>
          <div className="settings__title">إعدادات شاشة المسجد</div>
          <div className="settings__hint">
            تُحفظ تلقائياً في هذا الجهاز. اضغط Esc أو زر العودة للخروج.
          </div>
        </div>
        <div className="settings__actions">
          <button className="btn btn--ghost" onClick={exportJson}>
            تصدير JSON
          </button>
          <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
            استيراد JSON
          </button>
          <button
            className="btn btn--danger"
            onClick={() => {
              if (confirm('استعادة كل الإعدادات الافتراضية؟')) {
                reset();
                notify('تمت الاستعادة');
              }
            }}
          >
            استعادة الافتراضي
          </button>
          <button className="btn" onClick={onClose}>
            عودة للعرض
          </button>
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
      />

      <div className="settings__grid">
        <Section title="المسجد">
          <TextField
            label="اسم المسجد"
            value={settings.mosqueName}
            onChange={(v) => update({ mosqueName: v })}
          />
          <TextField
            label="الشعار النصي"
            value={settings.tagline}
            onChange={(v) => update({ tagline: v })}
          />
          <div className="field">
            <label className="field__label">شعار مصوّر</label>
            <div className="settings__actions">
              <button className="btn btn--ghost" onClick={() => logoRef.current?.click()}>
                رفع صورة
              </button>
              {settings.logoDataUrl && (
                <button className="btn btn--ghost" onClick={() => update({ logoDataUrl: '' })}>
                  إزالة
                </button>
              )}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && importLogo(e.target.files[0])}
            />
            <div className="field__note">
              PNG أو SVG بخلفية شفافة. إن تُرك فارغاً يُستخدم الرسم الافتراضي.
            </div>
          </div>
        </Section>

        <Section
          title="الموقع وطريقة الحساب"
          desc="تغيير أي حقل هنا يعيد جلب المواقيت من الخادم فوراً."
        >
          <TextField label="المدينة" value={settings.city} onChange={(v) => update({ city: v })} />
          <div className="row">
            <TextField
              label="خط العرض"
              type="number"
              value={settings.latitude}
              onChange={(v) => update({ latitude: num(v, settings.latitude) })}
            />
            <TextField
              label="خط الطول"
              type="number"
              value={settings.longitude}
              onChange={(v) => update({ longitude: num(v, settings.longitude) })}
            />
          </div>
          <SelectField
            label="طريقة الحساب"
            value={settings.method}
            options={CALC_METHODS.map((m) => ({ value: m.id, label: m.nameAr }))}
            onChange={(v) => update({ method: num(v, settings.method) })}
          />
          <SelectField
            label="مذهب حساب العصر"
            value={settings.school}
            options={[
              { value: 0, label: 'الجمهور - شافعي ومالكي وحنبلي' },
              { value: 1, label: 'حنفي' },
            ]}
            onChange={(v) => update({ school: num(v, 0) === 1 ? 1 : 0 })}
          />
        </Section>

        <Section
          title="تعديل المواقيت بالدقائق"
          desc="يضاف أو يطرح من الوقت المحسوب لمطابقة التقويم المحلي المعتمد."
        >
          <div className="minute-grid">
            {PRAYER_ORDER.map((key) => (
              <div key={key}>
                <label className="field__label">{PRAYER_NAMES[key]}</label>
                <input
                  className="input"
                  type="number"
                  value={settings.offsets[key]}
                  onChange={(e) => setOffset(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="فروقات الإقامة بالدقائق" desc="المدة بين الأذان والإقامة لكل صلاة.">
          <div className="minute-grid">
            {IQAMA_KEYS.map((key) => (
              <div key={key}>
                <label className="field__label">{PRAYER_NAMES[key]}</label>
                <input
                  className="input"
                  type="number"
                  value={settings.iqamaGaps[key]}
                  onChange={(e) => setGap(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="شاشات الأذان والإقامة">
          <CheckField
            label="عرض شاشة الأذان"
            checked={settings.adhanScreenEnabled}
            onChange={(v) => update({ adhanScreenEnabled: v })}
          />
          <TextField
            label="مدة شاشة الأذان بالثواني"
            type="number"
            value={settings.adhanScreenSeconds}
            onChange={(v) => update({ adhanScreenSeconds: num(v, 180) })}
          />
          <CheckField
            label="عرض العد التنازلي للإقامة"
            checked={settings.iqamaScreenEnabled}
            onChange={(v) => update({ iqamaScreenEnabled: v })}
          />
          <CheckField
            label="عرض شاشة الصمت بعد الإقامة"
            checked={settings.silenceScreenEnabled}
            onChange={(v) => update({ silenceScreenEnabled: v })}
          />
          <TextField
            label="مدة شاشة الصمت بالدقائق"
            type="number"
            value={settings.silenceMinutes}
            onChange={(v) => update({ silenceMinutes: num(v, 8) })}
          />
        </Section>

        <Section
          title="الصوت"
          desc="ضع ملفي adhan.mp3 و adhan-fajr.mp3 داخل مجلد public/audio."
        >
          <CheckField
            label="تشغيل صوت الأذان"
            checked={settings.audioEnabled}
            onChange={(v) => update({ audioEnabled: v })}
          />
          <TextField
            label="مستوى الصوت من 0 إلى 1"
            type="number"
            value={settings.audioVolume}
            onChange={(v) => update({ audioVolume: Math.min(1, Math.max(0, num(v, 0.8))) })}
          />
        </Section>

        <Section title="المظهر">
          <TextareaField
            label="الخلفيات المتناوبة"
            value={settings.backgrounds.join('\n')}
            onChange={(v) =>
              update({
                backgrounds: v
                  .split('\n')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
            note="مسار في كل سطر. ضع صورك في public/bg ثم اكتب ./bg/name.webp — خلفية واحدة تعني ثبات المشهد."
          />
          <TextField
            label="مدة بقاء كل خلفية بالثواني"
            type="number"
            value={settings.backgroundRotateSeconds}
            onChange={(v) => update({ backgroundRotateSeconds: num(v, 90) })}
            note="أقل قيمة مقبولة 15 ثانية. الانتقال بينها تلاشٍ ناعم في ثانيتين."
          />
          <div className="row">
            <TextField
              label="الشعار الجانبي - السطر الأول"
              value={settings.sideBannerLine1}
              onChange={(v) => update({ sideBannerLine1: v })}
            />
            <TextField
              label="السطر الثاني"
              value={settings.sideBannerLine2}
              onChange={(v) => update({ sideBannerLine2: v })}
            />
          </div>
          <CheckField
            label="نظام 24 ساعة"
            checked={settings.use24h}
            onChange={(v) => update({ use24h: v })}
          />
          <CheckField
            label="أرقام هندية"
            checked={settings.arabicNumerals}
            onChange={(v) => update({ arabicNumerals: v })}
          />
          <CheckField
            label="حماية الشاشة من الحرق"
            checked={settings.burnInProtection}
            onChange={(v) => update({ burnInProtection: v })}
          />
        </Section>

        <Section title="الآيات" desc="آية في كل سطر، ويفصل بينها وبين مصدرها الرمز |">
          <TextareaField
            label="قائمة الآيات"
            value={settings.ayat.map((a) => `${a.text} | ${a.source}`).join('\n')}
            onChange={(v) =>
              update({
                ayat: v
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [text, source = ''] = line.split('|');
                    return { text: text.trim(), source: source.trim() };
                  }),
              })
            }
          />
          <TextField
            label="مدة عرض كل آية بالثواني"
            type="number"
            value={settings.ayahRotateSeconds}
            onChange={(v) => update({ ayahRotateSeconds: num(v, 30) })}
          />
        </Section>

        <Section title="الشريط المتحرك" desc="رسالة في كل سطر.">
          <TextareaField
            label="الرسائل"
            value={settings.marqueeMessages.join('\n')}
            onChange={(v) =>
              update({
                marqueeMessages: v
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
          <TextField
            label="مدة دورة الشريط بالثواني"
            type="number"
            value={settings.marqueeSeconds}
            onChange={(v) => update({ marqueeSeconds: num(v, 45) })}
            note="كلما زاد الرقم كان الشريط أبطأ."
          />
        </Section>
      </div>

      {flash && <div className="saved-flash">{flash}</div>}
    </div>
  );
}
