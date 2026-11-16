import Hero from '../sections/Hero';
import ProblemSolution from '../sections/ProblemSolution';
import HowItWorks from '../sections/HowItWorks';
import AppShowcase from '../sections/AppShowcase';
import ClubPlan from '../sections/ClubPlan';
import FranchiseModel from '../sections/FranchiseModel';
import CtaBand from '../sections/CtaBand';
import Simulator from '../sections/Simulator';
import Join from '../sections/Join';
import Support from '../sections/Support';
import FranceMap from '../sections/FranceMap';
import Faq from '../sections/Faq';
import ApplicationForm from '../sections/ApplicationForm';
import { usePageMeta } from '../hooks/usePageMeta';

/**
 * One-page de recrutement des franchisés — pattern « Feature-Rich Showcase » du skill :
 * Hero → atouts → cas d'usage → CTA répété (hero, milieu, fin + CTA mobile collant).
 */
export default function Home() {
  usePageMeta(
    "APEX FITNESS — Devenez franchisé du Smart Studio qui s'adapte à chacun",
    "APEX FITNESS : la salle de sport intelligente où chaque machine se règle seule. Découvrez le modèle de franchise Smart Studio et demandez votre dossier.",
  );
  return (
    <>
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <AppShowcase />
      <ClubPlan />
      <FranchiseModel />
      <CtaBand title="Votre club. Votre ville. Notre plateforme." text="Recevez le dossier complet : concept, modèle économique détaillé, étapes et calendrier." />
      <Simulator />
      <Join />
      <Support />
      <FranceMap />
      <Faq />
      <ApplicationForm />
    </>
  );
}
