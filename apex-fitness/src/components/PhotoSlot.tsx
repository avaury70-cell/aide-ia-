/** Emplacement réservé à une future photo (aucune photo de banque d'images). */
export default function PhotoSlot({ label, ratio = 'aspect-[4/3]', className = '' }: { label: string; ratio?: string; className?: string }) {
  return (
    <figure className={`relative overflow-hidden rounded-card border-2 border-dashed border-primary/50 bg-ink ${ratio} ${className}`} role="img" aria-label={`Emplacement photo à ajouter : ${label}`}>
      <div className="bg-stripes absolute inset-0 opacity-60" />
      <figcaption className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="rounded-[4px] bg-primary px-2 py-0.5 font-display text-sm font-bold uppercase tracking-widest text-ink">[Photo à ajouter]</span>
        <span className="max-w-[28ch] text-sm text-fg-muted">{label}</span>
      </figcaption>
    </figure>
  );
}
