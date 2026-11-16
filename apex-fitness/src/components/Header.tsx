import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Icon from './Icon';
import MagneticButton from './MagneticButton';

const LINKS = [
  { to: '/#concept', label: 'Le concept' },
  { to: '/#modele', label: 'Le modèle' },
  { to: '/#simulateur', label: 'Simulateur' },
  { to: '/#rejoindre', label: 'Rejoindre' },
  { to: '/#faq', label: 'FAQ' },
];
const PAGES = [
  { to: '/concept', label: 'Grand public' },
  { to: '/presse', label: 'Presse' },
  { to: '/charte', label: 'Charte' },
];

/** En-tête collant : fond flouté dès que l'on défile, menu mobile accessible. */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${scrolled || open ? 'border-b border-bone/10 bg-carbon/80 backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="container-apex flex h-[72px] items-center justify-between gap-6">
        <Link to="/" aria-label="APEX FITNESS — accueil" className="shrink-0 text-[15px]">
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="rounded-lg px-3 py-2 text-sm text-mute transition-colors hover:text-bone">
                  {l.label}
                </Link>
              </li>
            ))}
            <li aria-hidden="true" className="mx-2 h-5 w-px bg-bone/15" />
            {PAGES.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm transition-colors hover:text-bone ${isActive ? 'text-signal' : 'text-mute'}`}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <MagneticButton to="/#candidature" className="hidden min-h-[44px] px-5 text-sm sm:inline-flex">
            Devenir franchisé
          </MagneticButton>
          <button
            ref={btnRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-bone/15 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" aria-label="Menu mobile" className="h-[calc(100dvh-72px)] overflow-y-auto border-t border-bone/10 bg-carbon lg:hidden">
          <ul className="container-apex flex flex-col gap-1 py-6">
            {[...LINKS, ...PAGES].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="block rounded-control px-3 py-4 font-display text-2xl text-bone hover:bg-graphite">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-4">
              <Link to="/#candidature" className="btn-primary w-full">Devenir franchisé</Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
