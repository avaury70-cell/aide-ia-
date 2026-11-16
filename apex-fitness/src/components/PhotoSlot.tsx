/** Emplacement réservé à une future photo (aucune photo libre de droits utilisée). */
export default function PhotoSlot({ label, ratio = 'aspect-[4/3]', className = '' }: { label: string; ratio?: string; className?: string }) {
  return (
    <figure
      className={`relative overflow-hidden rounded-card border border-dashed border-data/40 bg-graphite ${ratio} ${className}`}
      role="img"
      aria-label={`Emplacement photo à ajouter : ${label}`}
    >
      <div className="bg-dots absolute inset-0 opacity-70" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 30% 20%, rgba(60,224,255,0.12), transparent 70%)' }} />
      <figcaption className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-data">[PHOTO À AJOUTER]</span>
        <span className="max-w-[28ch] text-sm text-mute">{label}</span>
      </figcaption>
    </figure>
  );
}
