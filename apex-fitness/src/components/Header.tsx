import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Icon from './Icon';
import MagneticButton from './MagneticButton';

const LINKS = [
  { to: '/#concept', label: 'Concept' },
  { to: '/#appli', label: "L'appli" },
  { to: '/#modele', label: 'Modèle' },
  { to: '/#simulateur', label: 'Simulateur' },
  { to: '/#rejoindre', label: 'Rejoindre' },
  { to: '/#faq', label: 'FAQ' },
];
const PAGES = [
  { to: '/concept', label: 'Grand public' },
  { to: '/presse', label: 'Presse' },
  { to: '/charte', label: 'Charte' },
];

/** En-tête collant, barre de progression de lecture, menu mobile accessible (Échap, aria-expanded). */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 12);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (setOpen(false), btnRef.current?.focus());
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={`sticky top-0 z-50 transition-[background-color,box-shadow] duration-300 ${scrolled || open ? 'bg-bg/95 shadow-lg backdrop-blur-md' : 'bg-bg'}`}>
      <div className="container-apex flex h-[72px] items-center justify-between gap-6">
        <Link to="/" aria-label="APEX FITNESS — accueil" className="shrink-0 text-[15px]">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden xl:block">
          <ul className="flex items-center gap-0.5 font-display text-[17px] font-semibold uppercase tracking-wide">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="rounded-control px-3 py-2 text-fg-muted transition-colors duration-200 hover:bg-card hover:text-fg">{l.label}</Link>
              </li>
            ))}
            <li aria-hidden="true" className="mx-2 h-6 w-[3px] rotate-12 bg-primary" />
            {PAGES.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className={({ isActive }) => `rounded-control px-3 py-2 transition-colors duration-200 hover:bg-card hover:text-fg ${isActive ? 'bg-primary text-ink hover:bg-primary hover:text-ink' : 'text-fg-muted'}`}>{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <MagneticButton to="/#candidature" className="hidden min-h-[44px] px-5 text-base sm:inline-flex">Devenir franchisé</MagneticButton>
          <button ref={btnRef} type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-control border-2 border-line transition-colors hover:border-primary xl:hidden" aria-expanded={open} aria-controls="menu-mobile" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="h-[3px] bg-ink">
        <div ref={bar} className="h-full origin-left bg-primary" style={{ transform: 'scaleX(0)' }} />
      </div>

      {open && (
        <nav id="menu-mobile" aria-label="Menu mobile" className="h-[calc(100dvh-75px)] overflow-y-auto bg-bg xl:hidden">
          <ul className="container-apex flex flex-col py-6">
            {[...LINKS, ...PAGES].map((l, i) => (
              <li key={l.to} className="border-b border-line">
                <Link to={l.to} className="flex items-center justify-between py-4 font-display text-3xl font-bold uppercase transition-colors hover:text-primary-soft">
                  <span><span className="mr-3 text-base text-primary-soft">{String(i + 1).padStart(2, '0')}</span>{l.label}</span>
                  <Icon name="arrow" />
                </Link>
              </li>
            ))}
            <li className="mt-6"><Link to="/#candidature" className="btn-primary w-full">Devenir franchisé</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
