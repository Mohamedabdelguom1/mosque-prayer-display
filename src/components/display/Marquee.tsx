interface Props {
  messages: string[];
  seconds: number;
}

/**
 * شريط متحرك متواصل.
 * نكرّر القائمة مرتين ونحرّك المسار بمقدار 50% فيبدو الدوران بلا انقطاع.
 */
export function Marquee({ messages, seconds }: Props) {
  if (messages.length === 0) return null;
  const doubled = [...messages, ...messages];

  return (
    <div className="marquee">
      <div
        className="marquee__track"
        style={{ '--marquee-duration': `${Math.max(10, seconds)}s` } as React.CSSProperties}
      >
        {doubled.map((msg, i) => (
          <span className="marquee__item" key={i}>
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
