/**
 * Apparition en cascade d'une grille — préréglage « Stagger List » du skill :
 * gsap.from(items, { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: 0.06, ease: 'back.out(1.4)' })
 * Déclenché à l'entrée dans l'écran. Le contenu reste visible sans JS
 * et s'affiche directement si prefers-reduced-motion.
 */
import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

export default function Stagger({ children, as: Tag = 'div', className = '', selector = ':scope > *' }: { children: ReactNode; as?: ElementType; className?: string; selector?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(selector));
    items.forEach((i) => (i.style.opacity = '0'));
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const { gsap } = await import('gsap');
        if (cancelled) return;
        gsap.fromTo(items, { opacity: 0, scale: 0.92, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: { each: 0.06, grid: 'auto' }, ease: 'back.out(1.4)', clearProps: 'transform' });
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      items.forEach((i) => (i.style.opacity = ''));
    };
  }, [selector]);
  return <Tag ref={ref} className={className}>{children}</Tag>;
}
