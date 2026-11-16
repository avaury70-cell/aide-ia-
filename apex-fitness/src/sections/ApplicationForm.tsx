/**
 * Formulaire de demande de dossier de candidature.
 * - Validation côté front (au blur puis à la soumission)
 * - Messages d'erreur liés aux champs (aria-describedby, aria-invalid)
 * - Récapitulatif des erreurs focalisé à la soumission
 * - État de succès. Projet pédagogique : AUCUNE donnée n'est envoyée.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import MagneticButton from '../components/MagneticButton';
import { CITIES } from '../data/zones';
import { ZONE_EVENT } from './FranceMap';

type Values = { firstName: string; lastName: string; email: string; phone: string; zone: string; contribution: string; profile: string; timing: string; message: string; consent: boolean };
const INITIAL: Values = { firstName: '', lastName: '', email: '', phone: '', zone: '', contribution: '', profile: '', timing: '', message: '', consent: false };

function validate(v: Values): Partial<Record<keyof Values, string>> {
  const e: Partial<Record<keyof Values, string>> = {};
  if (v.firstName.trim().length < 2) e.firstName = 'Indiquez votre prénom.';
  if (v.lastName.trim().length < 2) e.lastName = 'Indiquez votre nom.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Saisissez une adresse e-mail valide, par exemple nom@domaine.fr.';
  if (!/^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/.test(v.phone.trim())) e.phone = 'Saisissez un numéro français valide, par exemple 06 12 34 56 78.';
  if (!v.zone) e.zone = 'Choisissez une zone souhaitée.';
  if (!v.contribution) e.contribution = 'Indiquez votre apport personnel.';
  if (!v.profile) e.profile = 'Indiquez votre profil.';
  if (v.message.length > 1000) e.message = '1 000 caractères maximum.';
  if (!v.consent) e.consent = 'Votre accord est nécessaire pour traiter votre demande.';
  return e;
}

const LABELS: Record<keyof Values, string> = { firstName: 'Prénom', lastName: 'Nom', email: 'E-mail', phone: 'Téléphone', zone: 'Zone souhaitée', contribution: 'Apport personnel', profile: 'Profil', timing: "Horizon d'ouverture", message: 'Message', consent: 'Consentement' };

export default function ApplicationForm() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const errors = validate(values);
  const show = (k: keyof Values) => (submitted || touched[k]) && errors[k];

  // préremplissage depuis la carte
  useEffect(() => {
    const on = (e: Event) => setValues((v) => ({ ...v, zone: (e as CustomEvent<string>).detail }));
    window.addEventListener(ZONE_EVENT, on);
    return () => window.removeEventListener(ZONE_EVENT, on);
  }, []);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setValues((v) => ({ ...v, [k]: val }));
  const blur = (k: keyof Values) => setTouched((t) => ({ ...t, [k]: true }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setStatus('sending');
    // Simulation d'envoi (aucun serveur : projet pédagogique)
    window.setTimeout(() => {
      setStatus('success');
      requestAnimationFrame(() => successRef.current?.focus());
    }, 900);
  };

  const errorList = Object.entries(errors) as [keyof Values, string][];

  return (
    <section id="candidature" aria-labelledby="form-title" className="section relative overflow-hidden border-t border-bone/5">
      <div className="bg-halo pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full border-[18px] border-signal/10 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,0_40%,30%_0)]" />
      <div className="container-apex relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="flex flex-col gap-6">
          <span className="eyebrow">Candidature</span>
          <h2 id="form-title" className="title-section">Recevez le dossier de candidature.</h2>
          <p className="lead">Présentation complète du concept, modèle économique détaillé, étapes et calendrier. Un·e chargé·e de développement vous rappelle sous 72 h ouvrées.</p>
          <ul className="flex flex-col gap-3 text-bone">
            {['Sans engagement', 'Échange confidentiel', 'DIP remis au moins 20 jours avant toute signature'].map((t) => (
              <li key={t} className="flex gap-3"><Icon name="check" className="text-signal" /> {t}</li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={100} className="glass p-6 sm:p-8">
          {status === 'success' ? (
            <div ref={successRef} tabIndex={-1} role="status" className="flex flex-col items-start gap-4 py-10 outline-none">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-signal text-carbon"><Icon name="check" size={28} /></span>
              <h3 className="text-3xl font-semibold">Merci {values.firstName}, c'est bien reçu.</h3>
              <p className="text-mute">Votre demande pour la zone <strong className="text-bone">{values.zone}</strong> est enregistrée. Vous recevrez le dossier à l'adresse {values.email}.</p>
              <p className="rounded-control border border-data/30 bg-data/5 p-3 text-sm text-data">Projet pédagogique fictif : aucune donnée n'a été transmise ni conservée.</p>
              <button type="button" className="btn-ghost" onClick={() => { setValues(INITIAL); setTouched({}); setSubmitted(false); setStatus('idle'); }}>Nouvelle demande</button>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} aria-describedby="form-note">
              {submitted && errorList.length > 0 && (
                <div ref={summaryRef} tabIndex={-1} role="alert" className="mb-6 rounded-control border border-alert/50 bg-alert/10 p-4 outline-none">
                  <p className="flex items-center gap-2 font-semibold text-alert"><Icon name="alert" size={18} /> {errorList.length} champ{errorList.length > 1 ? 's' : ''} à corriger</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-bone">
                    {errorList.map(([k]) => (
                      <li key={k}><a href={`#f-${k}`} className="underline underline-offset-2">{LABELS[k]}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field name="firstName" label="Prénom" error={show('firstName')} required>
                  {(p) => <input {...p} className="field" autoComplete="given-name" value={values.firstName} onChange={(e) => set('firstName', e.target.value)} onBlur={() => blur('firstName')} />}
                </Field>
                <Field name="lastName" label="Nom" error={show('lastName')} required>
                  {(p) => <input {...p} className="field" autoComplete="family-name" value={values.lastName} onChange={(e) => set('lastName', e.target.value)} onBlur={() => blur('lastName')} />}
                </Field>
                <Field name="email" label="E-mail" error={show('email')} required>
                  {(p) => <input {...p} type="email" className="field" autoComplete="email" inputMode="email" value={values.email} onChange={(e) => set('email', e.target.value)} onBlur={() => blur('email')} />}
                </Field>
                <Field name="phone" label="Téléphone" error={show('phone')} required>
                  {(p) => <input {...p} type="tel" className="field" autoComplete="tel" inputMode="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => blur('phone')} />}
                </Field>
                <Field name="zone" label="Zone souhaitée" error={show('zone')} required>
                  {(p) => (
                    <select {...p} className="field" value={values.zone} onChange={(e) => set('zone', e.target.value)} onBlur={() => blur('zone')}>
                      <option value="">Choisir…</option>
                      {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                      <option value="Autre">Autre ville</option>
                    </select>
                  )}
                </Field>
                <Field name="contribution" label="Apport personnel" error={show('contribution')} required>
                  {(p) => (
                    <select {...p} className="field" value={values.contribution} onChange={(e) => set('contribution', e.target.value)} onBlur={() => blur('contribution')}>
                      <option value="">Choisir…</option>
                      <option>Moins de 50 000 €</option>
                      <option>50 000 – 100 000 €</option>
                      <option>100 000 – 150 000 €</option>
                      <option>Plus de 150 000 €</option>
                    </select>
                  )}
                </Field>
                <Field name="profile" label="Votre profil" error={show('profile')} required>
                  {(p) => (
                    <select {...p} className="field" value={values.profile} onChange={(e) => set('profile', e.target.value)} onBlur={() => blur('profile')}>
                      <option value="">Choisir…</option>
                      <option>Entrepreneur·e</option>
                      <option>En reconversion</option>
                      <option>Coach sportif</option>
                      <option>Investisseur·se</option>
                    </select>
                  )}
                </Field>
                <Field name="timing" label="Horizon d'ouverture">
                  {(p) => (
                    <select {...p} className="field" value={values.timing} onChange={(e) => set('timing', e.target.value)}>
                      <option value="">Non précisé</option>
                      <option>Moins de 6 mois</option>
                      <option>6 à 12 mois</option>
                      <option>Plus de 12 mois</option>
                    </select>
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field name="message" label="Votre projet en quelques mots" error={show('message')} hint={`${values.message.length} / 1 000`}>
                    {(p) => <textarea {...p} rows={4} className="field resize-y" value={values.message} onChange={(e) => set('message', e.target.value)} onBlur={() => blur('message')} />}
                  </Field>
                </div>
              </div>

              <div className="mt-5">
                <label className="flex cursor-pointer gap-3 text-sm text-mute">
                  <input id="f-consent" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#B8FF3C]" checked={values.consent} onChange={(e) => set('consent', e.target.checked)} onBlur={() => blur('consent')} aria-invalid={!!show('consent')} aria-describedby={show('consent') ? 'e-consent' : undefined} required />
                  <span>J'accepte qu'APEX FITNESS utilise ces informations pour me recontacter au sujet de mon projet de franchise. <a href="/mentions-legales#rgpd" className="text-bone underline underline-offset-2">En savoir plus sur mes données</a>.</span>
                </label>
                {show('consent') && <p id="e-consent" className="mt-2 flex items-center gap-1.5 text-sm text-alert"><Icon name="alert" size={16} /> {errors.consent}</p>}
              </div>

              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <MagneticButton type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Envoi en cours…' : <>Recevoir le dossier <Icon name="arrow" size={18} /></>}
                </MagneticButton>
                <p id="form-note" className="text-xs text-faint">Champs marqués * obligatoires. Projet pédagogique : aucune donnée n'est envoyée.</p>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

type FieldProps = { id: string; name: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string; 'aria-required'?: boolean };
function Field({ name, label, error, required, hint, children }: { name: string; label: string; error?: string | false; required?: boolean; hint?: string; children: (p: FieldProps) => React.ReactNode }) {
  const uid = useId();
  const id = `f-${name}`;
  const errId = `${uid}-err`;
  const hintId = `${uid}-hint`;
  const describedby = [error ? errId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-bone">
          {label} {required && <span className="text-signal" aria-hidden="true">*</span>}
        </label>
        {hint && <span id={hintId} className="font-mono text-xs text-faint">{hint}</span>}
      </div>
      {children({ id, name, 'aria-invalid': !!error, 'aria-describedby': describedby, 'aria-required': required })}
      {error && <p id={errId} className="flex items-start gap-1.5 text-sm text-alert"><Icon name="alert" size={16} className="mt-0.5 shrink-0" /> {error}</p>}
    </div>
  );
}
