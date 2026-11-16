/** Bloc CTA intermédiaire (pattern du skill : CTA répété après les atouts). */
import MagneticButton from '../components/MagneticButton';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';

export default function CtaBand({ title, text, cta = 'Recevoir le dossier' }: { title: string; text: string; cta?: string }) {
  return (
    <section aria-label="Demande de dossier" className="relative overflow-hidden bg-primary text-ink">
      <div className="bg-stripes pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply" />
      <Reveal className="container-apex relative flex flex-col items-start justify-between gap-8 py-16 lg:flex-row lg:items-center">
        <div>
          <h2 className="max-w-[18ch] text-5xl text-ink sm:text-6xl">{title}</h2>
          <p className="mt-3 max-w-[50ch] text-lg font-medium">{text}</p>
        </div>
        <MagneticButton to="/#candidature" variant="dark" className="shrink-0 px-8 text-xl">
          {cta} <Icon name="arrow" size={22} />
        </MagneticButton>
      </Reveal>
    </section>
  );
}
