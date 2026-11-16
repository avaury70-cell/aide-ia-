import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';

// Pages secondaires chargées à la demande (code splitting)
const Concept = lazy(() => import('./pages/Concept'));
const Presse = lazy(() => import('./pages/Presse'));
const Charte = lazy(() => import('./pages/Charte'));
const Mentions = lazy(() => import('./pages/Mentions'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Gère le scroll lors des changements de route et des ancres (/#modele…). */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // attendre le rendu de la page cible
      const id = decodeURIComponent(hash.slice(1));
      const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 60);
      return () => window.clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-signal focus:px-4 focus:py-3 focus:font-semibold focus:text-carbon">
        Aller au contenu
      </a>
      <ScrollManager />
      <Header />
      <main id="contenu" tabIndex={-1} className="outline-none">
        <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/concept" element={<Concept />} />
            <Route path="/presse" element={<Presse />} />
            <Route path="/charte" element={<Charte />} />
            <Route path="/mentions-legales" element={<Mentions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
