import type { ChangeEvent, ReactNode } from 'react';

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

export function TextField({
  label,
  value,
  onChange,
  note,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  note?: string;
  type?: 'text' | 'number';
}) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <input
        className="input"
        type={type}
        value={value}
        step={type === 'number' ? 'any' : undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
      {note && <div className="field__note">{note}</div>}
    </div>
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
    <div className="field">
      <label className="field__label">{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {note && <div className="field__note">{note}</div>}
    </div>
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
    <div className="field">
      <label className="field__label">{label}</label>
      <textarea className="textarea" value={value} onChange={(e) => onChange(e.target.value)} />
      {note && <div className="field__note">{note}</div>}
    </div>
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
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
