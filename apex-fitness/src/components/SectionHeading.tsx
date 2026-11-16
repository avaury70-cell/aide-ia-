import type { ReactNode } from 'react';
import Reveal from './Reveal';

/** En-tête de section : étiquette-bloc, titre condensé XXL, chapeau. */
export default function SectionHeading({ eyebrow, title, lead, id, center, accent }: { eyebrow: string; title: ReactNode; lead?: ReactNode; id?: string; center?: boolean; accent?: boolean }) {
  return (
    <Reveal className={`mb-12 flex flex-col gap-5 lg:mb-16 ${center ? 'items-center text-center' : ''}`}>
      <span className={accent ? 'eyebrow-accent' : 'eyebrow'} style={center ? { alignSelf: 'center' } : undefined}>{eyebrow}</span>
      <h2 id={id} className="title-section max-w-[16ch]">{title}</h2>
      {lead && <p className={`lead ${center ? 'mx-auto' : ''}`}>{lead}</p>}
    </Reveal>
  );
}

/** Mot surligné par un bloc orange (signature typographique du style). */
export function Hl({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'accent' }) {
  return <span className={`inline-block -rotate-1 rounded-[6px] px-2 text-ink ${tone === 'accent' ? 'bg-accent' : 'bg-primary'}`}>{children}</span>;
}
