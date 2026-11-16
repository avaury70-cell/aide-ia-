import { useEffect } from 'react';

/** Titre et meta description par page (SEO de base). */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  }, [title, description]);
}
