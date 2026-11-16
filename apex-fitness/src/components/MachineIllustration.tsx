/**
 * Illustration statique de la machine (repli sans WebGL / mobile faible / économie de données,
 * et placeholder pendant le chargement de la 3D). Palette v2.
 */
export default function MachineIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Illustration d'une machine APEX : le QR code est scanné, l'anneau de résistance s'allume en orange et la charge se règle seule.">
      <defs>
        <linearGradient id="mi-metal" x1="0" x2="1"><stop offset="0" stopColor="#64748B" /><stop offset=".5" stopColor="#E2E8F0" /><stop offset="1" stopColor="#64748B" /></linearGradient>
      </defs>
      <rect x="40" y="300" width="320" height="50" rx="8" fill="#0F172A" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={50 + i * 40} y="312" width="22" height="6" rx="2" fill="#F97316" opacity={0.15 + i * 0.05} />)}
      <circle cx="180" cy="180" r="140" fill="#F97316" opacity=".08" />
      <rect x="120" y="50" width="14" height="255" rx="3" fill="#0F172A" />
      <rect x="230" y="50" width="14" height="255" rx="3" fill="#0F172A" />
      <rect x="110" y="42" width="144" height="16" rx="4" fill="#0F172A" />
      {Array.from({ length: 11 }, (_, i) => <rect key={i} x="146" y={292 - i * 11} width="72" height="9" rx="2" fill={i % 2 ? '#313742' : '#37414F'} />)}
      <rect x="138" y="225" width="90" height="6" rx="3" fill="#22C55E" />
      <path d="M216 76 A100 100 0 1 1 144 76" fill="none" stroke="#F97316" strokeWidth="10" strokeLinecap="round" />
      <rect x="152" y="140" width="58" height="95" rx="10" fill="#313742" />
      <rect x="144" y="240" width="76" height="16" rx="7" fill="#313742" />
      <path d="M126 70 C 100 120, 96 160, 92 200" stroke="url(#mi-metal)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M236 70 C 262 120, 266 160, 270 200" stroke="url(#mi-metal)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <g transform="translate(288 112)">
        <rect width="82" height="82" rx="8" fill="#F8FAFC" stroke="#22C55E" strokeWidth="4" />
        {[[9, 9], [51, 9], [9, 51]].map(([x, y]) => (
          <g key={`${x}${y}`}><rect x={x} y={y} width="22" height="22" fill="#0F172A" /><rect x={x + 4} y={y + 4} width="14" height="14" fill="#F8FAFC" /><rect x={x + 7} y={y + 7} width="8" height="8" fill="#0F172A" /></g>
        ))}
        {[[38, 10], [42, 22], [38, 34], [54, 38], [64, 46], [46, 52], [58, 60], [42, 64], [66, 66], [36, 46]].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" fill="#0F172A" />)}
        <rect x="-6" y="54" width="94" height="3" fill="#22C55E" />
      </g>
      <path d="M300 200 Q 300 260 250 262" stroke="#22C55E" strokeWidth="2" fill="none" className="flow-line" />
    </svg>
  );
}
