import { MosqueLogo } from './icons';

interface Props {
  name: string;
  tagline: string;
  logoDataUrl: string;
}

export function MosqueIdentity({ name, tagline, logoDataUrl }: Props) {
  return (
    <div className="identity">
      <div className="identity__logo">
        {logoDataUrl ? <img src={logoDataUrl} alt="" /> : <MosqueLogo className="identity__logo" />}
      </div>
      <div>
        <div className="identity__name">{name}</div>
        <div className="identity__tagline">{tagline}</div>
      </div>
    </div>
  );
}
