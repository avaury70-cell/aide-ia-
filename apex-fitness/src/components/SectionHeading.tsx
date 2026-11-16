import type { ReactNode } from 'react';
import Reveal from './Reveal';

export default function SectionHeading({ eyebrow, title, lead, id, center }: { eyebrow: string; title: ReactNode; lead?: ReactNode; id?: string; center?: boolean }) {
  return (
    <Reveal className={`mb-12 flex flex-col gap-4 ${center ? 'items-center text-center' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id} className="title-section max-w-[22ch]">{title}</h2>
      {lead && <p className={`lead ${center ? 'mx-auto' : ''}`}>{lead}</p>}
    </Reveal>
  );
}
