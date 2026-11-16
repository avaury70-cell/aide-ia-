import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';

/**
 * CTA collant sur mobile (pattern « Hero sticky CTA » du skill) :
 * apparaît après le hero, disparaît quand le formulaire est visible.
 */
export default function StickyCta() {
  const [show, setShow] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== '/') return setShow(false);
    const on = () => {
      const form = document.getElementById('candidature');
      const formTop = form ? form.getBoundingClientRect().top : Infinity;
      setShow(window.scrollY > window.innerHeight * 0.9 && formTop > window.innerHeight * 0.8);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [pathname]);

  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-primary bg-ink/95 p-3 backdrop-blur-md transition-transform duration-300 lg:hidden ${show ? 'translate-y-0' : 'translate-y-full'}`} aria-hidden={!show}>
      <Link to="/#candidature" tabIndex={show ? 0 : -1} className="btn-primary w-full">
        Recevoir le dossier <Icon name="arrow" size={20} />
      </Link>
    </div>
  );
}
