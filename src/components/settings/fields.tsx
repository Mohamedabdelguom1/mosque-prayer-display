import { useRef, useState, type ReactNode } from 'react';
import { editAction, rowAction, type RowKind } from '../../lib/remoteEdit';

export function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="sec">
      <h2 className="sec__title">{title}</h2>
      {desc && <p className="sec__desc">{desc}</p>}
      {children}
    </section>
  );
}

interface RowProps {
  kind: RowKind;
  label?: string;
  note?: string;
  /** يُستدعى عند ضبط رقم بالاسهم الافقية */
  onAdjust?: (delta: 1 | -1) => void;
  onToggle?: () => void;
  children: (editing: boolean) => ReactNode;
}

/**
 * صف قابل للتركيز يحيط بالحقل.
 *
 * البؤرة تقع عليه لا على الحقل، فلا تفتح لوحة مفاتيح التلفاز
 * ولا تبتلع مفاتيح الاتجاه. وعند OK يدخل وضع التحرير فتنتقل
 * البؤرة الى الحقل الحقيقي، ويخرج منه بزر الرجوع.
 */
export function Row({ kind, label, note, onAdjust, onToggle, children }: RowProps) {
  const [editing, setEditing] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const innerControl = () =>
    rowRef.current?.querySelector<HTMLElement>('input, select, textarea, button');

  const enterEdit = () => {
    setEditing(true);
    // ننتظر رسمة حتى يصبح الحقل قابلا للتركيز قبل ان نركّز عليه
    requestAnimationFrame(() => innerControl()?.focus());
  };

  const exitEdit = () => {
    setEditing(false);
    requestAnimationFrame(() => rowRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editing) {
      if (editAction(e.key, kind) === 'exit') {
        e.preventDefault();
        e.stopPropagation();
        exitEdit();
      }
      // بقية المفاتيح ملك الحقل ولوحة المفاتيح
      return;
    }

    const action = rowAction(e.key, kind);
    if (action.type === 'navigate' || action.type === 'none') return; // اللوحة تتكفّل بالتنقّل

    e.preventDefault();
    e.stopPropagation();

    if (action.type === 'enter-edit') enterEdit();
    else if (action.type === 'toggle') onToggle?.();
    else if (action.type === 'activate') innerControl()?.click();
    else if (action.type === 'adjust') onAdjust?.(action.delta);
  };

  return (
    <div
      className={`frow${editing ? ' frow--editing' : ''}`}
      tabIndex={editing ? -1 : 0}
      data-nav={editing ? undefined : 'row'}
      data-editing={editing ? 'true' : 'false'}
      ref={rowRef}
      onKeyDown={onKeyDown}
    >
      {label && <span className="field__label">{label}</span>}
      {children(editing)}
      {note && <span className="field__note">{note}</span>}
      {editing && <span className="frow__badge">اضغط رجوع للخروج</span>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  note,
  type = 'text',
  step = 1,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  note?: string;
  type?: 'text' | 'number';
  step?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * نقرأ القيمة من عنصر DOM لا من الخاصية.
   * الضغط المتتابع على الريموت يرسل عدة احداث قبل ان يُعيد React الرسم،
   * فلو قرأنا الخاصية لقرأها كل ضغط قديمة وزادت القيمة خطوة واحدة فقط
   * مهما ضغطت. والكتابة في DOM فورا تُبقي التتابع صحيحا.
   */
  const adjust = (delta: 1 | -1) => {
    const el = inputRef.current;
    const current = Number(el?.value ?? value);
    if (!Number.isFinite(current)) return;

    const next = String(Number((current + delta * step).toFixed(6)));
    if (el) el.value = next;
    onChange(next);
  };

  return (
    <Row
      kind={type === 'number' ? 'number' : 'text'}
      label={label}
      note={note}
      onAdjust={adjust}
    >
      {(editing) => (
        <input
          ref={inputRef}
          className="input"
          type={type}
          value={value}
          step={type === 'number' ? 'any' : undefined}
          tabIndex={editing ? 0 : -1}
          readOnly={!editing}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Row>
  );
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  note,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: string) => void;
  note?: string;
}) {
  return (
    <Row kind="select" label={label} note={note}>
      {(editing) => (
        <select
          className="select"
          value={value}
          tabIndex={editing ? 0 : -1}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={String(o.value)} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Row>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  note,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  note?: string;
}) {
  return (
    <Row kind="textarea" label={label} note={note}>
      {(editing) => (
        <textarea
          className="textarea"
          value={value}
          tabIndex={editing ? 0 : -1}
          readOnly={!editing}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Row>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row kind="check" onToggle={() => onChange(!checked)}>
      {() => (
        <span className="check">
          <input
            type="checkbox"
            checked={checked}
            tabIndex={-1}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>{label}</span>
        </span>
      )}
    </Row>
  );
}

/** زر ضمن تسلسل التنقّل بالريموت */
export function RowButton({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant?: 'ghost' | 'danger';
}) {
  return (
    <Row kind="button">
      {() => (
        <button
          type="button"
          tabIndex={-1}
          className={`btn${variant ? ` btn--${variant}` : ''}`}
          onClick={onPress}
        >
          {label}
        </button>
      )}
    </Row>
  );
}
