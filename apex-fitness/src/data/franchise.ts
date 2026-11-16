/**
 * MODÈLE ÉCONOMIQUE — HYPOTHÈSES PÉDAGOGIQUES
 * Toutes les valeurs ci-dessous sont fictives et servent à illustrer
 * le fonctionnement d'un réseau de franchise. Elles ne reposent sur
 * aucune étude de marché et doivent être remplacées par des données sourcées.
 */
export const franchise = {
  entryFee: 35000, // droit d'entrée HT
  investMin: 280000, // investissement global HT (travaux, machines connectées, équipement)
  investMax: 420000,
  contributionMin: 50000, // apport personnel minimum
  contributionMax: 150000,
  royaltyRate: 0.06, // redevance d'exploitation (% CA HT)
  marketingRate: 0.02, // redevance marketing national (% CA HT)
  platformFee: 890, // abonnement plateforme tech (€ HT / mois)
  contractYears: 7,
  surfaceMin: 250,
  surfaceMax: 400,
  staffMin: 2,
  staffMax: 3,
  trainingWeeks: 4,
  openingMonths: '6 à 9',
};

/** Hypothèses du simulateur (charges mensuelles HT). */
export const simAssumptions = {
  ancillaryRate: 0.12, // revenus annexes (coaching augmenté, B2B, santé) en % des abonnements
  salaryCost: 3300, // coût employeur moyen par salarié / mois
  equipmentLease: 4200, // location financière du parc de machines connectées / mois
  energyMaintenance: 1600, // énergie, maintenance, assurance / mois
  otherRate: 0.05, // frais divers (% CA)
};

export type SimInput = { members: number; price: number; rent: number; staff: number };

export function simulate({ members, price, rent, staff }: SimInput) {
  const a = simAssumptions;
  const subs = members * price;
  const ancillary = subs * a.ancillaryRate;
  const revenue = subs + ancillary;
  const charges = {
    Loyer: rent,
    'Masse salariale': staff * a.salaryCost,
    'Parc machines (location)': a.equipmentLease,
    'Redevances réseau': revenue * (franchise.royaltyRate + franchise.marketingRate) + franchise.platformFee,
    'Énergie, maintenance, assurance': a.energyMaintenance,
    'Frais divers': revenue * a.otherRate,
  };
  const totalCharges = Object.values(charges).reduce((s, v) => s + v, 0);
  // point mort : nombre d'abonnés pour couvrir les charges
  const variableRate = franchise.royaltyRate + franchise.marketingRate + a.otherRate;
  const fixed = rent + staff * a.salaryCost + a.equipmentLease + franchise.platformFee + a.energyMaintenance;
  const perMember = price * (1 + a.ancillaryRate) * (1 - variableRate);
  const breakEven = Math.ceil(fixed / perMember);
  return { revenue, subs, ancillary, charges, totalCharges, result: revenue - totalCharges, breakEven };
}

export const eur = (v: number, digits = 0) =>
  v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: digits });
