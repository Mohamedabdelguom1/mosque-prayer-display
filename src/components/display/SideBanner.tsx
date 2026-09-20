export function SideBanner({ line1, line2 }: { line1: string; line2: string }) {
  if (!line1 && !line2) return null;
  return (
    <div className="sidebanner">
      <div className="sidebanner__line">{line1}</div>
      <div className="sidebanner__line sidebanner__line--accent">{line2}</div>
      <div className="sidebanner__rule" />
    </div>
  );
}
