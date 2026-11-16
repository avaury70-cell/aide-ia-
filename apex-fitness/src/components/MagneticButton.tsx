import { Link } from 'react-router-dom';
import { useRef, type ReactNode, type PointerEvent } from 'react';
import { useFinePointer, useReducedMotion } from '../hooks/useMedia';

type Props = {
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'dark';
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  download?: boolean;
};

/**
 * Bouton « magnétique » : il suit légèrement le curseur (souris uniquement,
 * désactivé si prefers-reduced-motion). Cible tactile ≥ 48 px.
 */
export default function MagneticButton({ to, href, onClick, variant = 'primary', children, className = '', type = 'button', disabled, download }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const active = useFinePointer() && !useReducedMotion();

  const move = (e: PointerEvent) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.translate = `${(e.clientX - (r.left + r.width / 2)) * 0.2}px ${(e.clientY - (r.top + r.height / 2)) * 0.3}px`;
  };
  const leave = () => ref.current && (ref.current.style.translate = '');
  const cls = `btn-${variant} ${className}`;
  const h = { onPointerMove: move, onPointerLeave: leave };

  if (to) return <Link ref={(el) => (ref.current = el)} to={to} className={cls} {...h} onClick={onClick}>{children}</Link>;
  if (href) return <a ref={(el) => (ref.current = el)} href={href} className={cls} {...h} download={download}>{children}</a>;
  return <button ref={(el) => (ref.current = el)} type={type} className={cls} {...h} onClick={onClick} disabled={disabled}>{children}</button>;
}
