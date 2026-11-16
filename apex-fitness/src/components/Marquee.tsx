/** Bandeau défilant en bloc plein (motif animé, se met en pause au survol ; figé si reduced-motion). */
export default function Marquee({ items, tone = 'primary' }: { items: string[]; tone?: 'primary' | 'accent' | 'ink' }) {
  const bg = tone === 'accent' ? 'bg-accent text-ink' : tone === 'ink' ? 'bg-ink text-fg' : 'bg-primary text-ink';
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-8 px-4 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
          {t}
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)" fill="currentColor" /></svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee overflow-hidden py-4 ${bg}`}>
      <div className="marquee-track flex w-max">{row(false)}{row(true)}</div>
    </div>
  );
}
