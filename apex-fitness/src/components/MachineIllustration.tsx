/**
 * Illustration statique de la machine (repli si WebGL indisponible,
 * mobile peu puissant, mode économie de données). Sert aussi de
 * placeholder pendant le chargement de la 3D.
 */
export default function MachineIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Illustration d'une machine APEX : un QR code scanné, l'anneau de résistance allumé en vert et la charge réglée automatiquement.">
      <defs>
        <linearGradient id="mi-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#5d6773" />
          <stop offset=".5" stopColor="#c9d1da" />
          <stop offset="1" stopColor="#5d6773" />
        </linearGradient>
        <radialGradient id="mi-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#B8FF3C" stopOpacity=".28" />
          <stop offset="1" stopColor="#B8FF3C" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* sol en points */}
      {Array.from({ length: 9 }, (_, r) => Array.from({ length: 19 }, (_, c) => <circle key={`${r}-${c}`} cx={20 + c * 20} cy={330 + r * 8} r={1.1} fill="#3CE0FF" opacity={0.15 + r * 0.03} />))}
      <ellipse cx="190" cy="340" rx="140" ry="22" fill="none" stroke="#3CE0FF" strokeOpacity=".4" />
      <circle cx="180" cy="180" r="130" fill="url(#mi-glow)" />
      {/* tour */}
      <rect x="120" y="50" width="12" height="285" rx="3" fill="#12161c" stroke="#2A3340" />
      <rect x="230" y="50" width="12" height="285" rx="3" fill="#12161c" stroke="#2A3340" />
      <rect x="112" y="44" width="138" height="14" rx="4" fill="#12161c" stroke="#2A3340" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="146" y={322 - i * 11} width="70" height="9" rx="2" fill={i % 2 ? '#171c23' : '#2c343f'} />
      ))}
      <rect x="138" y="245" width="88" height="5" rx="2.5" fill="#B8FF3C" />
      {/* anneau de résistance ouvert */}
      <path d="M216 76 A100 100 0 1 1 144 76" fill="none" stroke="#B8FF3C" strokeWidth="7" strokeLinecap="round" />
      {/* dossier + siège */}
      <rect x="152" y="140" width="58" height="105" rx="10" fill="#1b212b" stroke="#2A3340" />
      <rect x="144" y="252" width="76" height="16" rx="7" fill="#1b212b" stroke="#2A3340" />
      <path d="M126 70 C 100 120, 96 160, 92 200" stroke="url(#mi-metal)" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M236 70 C 262 120, 266 160, 270 200" stroke="url(#mi-metal)" strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* QR */}
      <g transform="translate(290 118)">
        <rect width="78" height="78" rx="6" fill="#F4F6F8" stroke="#B8FF3C" strokeWidth="3" />
        {[[8, 8], [48, 8], [8, 48]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <rect x={x} y={y} width="22" height="22" fill="#0A0D12" />
            <rect x={x + 4} y={y + 4} width="14" height="14" fill="#F4F6F8" />
            <rect x={x + 7} y={y + 7} width="8" height="8" fill="#0A0D12" />
          </g>
        ))}
        {[[36, 10], [40, 22], [36, 34], [52, 36], [62, 44], [44, 50], [56, 58], [40, 62], [64, 64], [34, 44]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" fill="#0A0D12" />
        ))}
        <rect x="-6" y="52" width="90" height="2" fill="#3CE0FF" />
      </g>
      <path d="M300 200 Q 300 260 250 262" stroke="#3CE0FF" strokeWidth="1.5" fill="none" className="flow-line" />
    </svg>
  );
}
