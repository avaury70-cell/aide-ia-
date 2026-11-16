import { Link } from 'react-router-dom';
import { useRef, type ReactNode, type PointerEvent } from 'react';
import { useFinePointer, useReducedMotion } from '../hooks/useMedia';

type Props = {
  to?: string; // lien interne (react-router) ou ancre
  href?: string; // lien externe / fichier
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  download?: boolean;
};

/**
 * Bouton « magnétique » : il se décale légèrement vers le curseur.
 * Désactivé sur écrans tactiles et si prefers-reduced-motion.
 */
export default function MagneticButton({ to, href, onClick, variant = 'primary', children, className = '', type = 'button', disabled, download }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const active = fine && !reduced;

  const move = (e: PointerEvent) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.25;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  const cls = `${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${className}`;
  const handlers = { onPointerMove: move, onPointerLeave: leave };

  if (to)
    return (
      <Link ref={(el) => (ref.current = el)} to={to} className={cls} {...handlers} onClick={onClick}>
        {children}
      </Link>
    );
  if (href)
    return (
      <a ref={(el) => (ref.current = el)} href={href} className={cls} {...handlers} download={download}>
        {children}
      </a>
    );
  return (
    <button ref={(el) => (ref.current = el)} type={type} className={cls} {...handlers} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
