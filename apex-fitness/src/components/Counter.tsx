import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useMedia';

/** Compteur animé déclenché à l'apparition. La valeur finale est toujours lisible par les lecteurs d'écran. */
export default function Counter({ value, prefix = '', suffix = '', duration = 1400, decimals = 0 }: { value: number; prefix?: string; suffix?: string; duration?: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) return setN(value);
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setN(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, reduced]);

  const fmt = (x: number) => x.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref}>
      <span aria-hidden="true">{prefix}{fmt(n)}{suffix}</span>
      <span className="sr-only">{prefix}{fmt(value)}{suffix}</span>
    </span>
  );
}
