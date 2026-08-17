// Permanent upgrade tree, bought with cores between runs. Deliberately small
// for the vertical slice; the depth pass will grow this into a branching tree.

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  max: number;
  cost: (lvl: number) => number; // cost of the NEXT level given current lvl
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'dmg',    name: 'Damage',          desc: '+10% tower damage / lvl',   max: 25, cost: (l) => Math.round(12 * Math.pow(1.5, l)) },
  { id: 'rate',   name: 'Fire Rate',       desc: '+6% fire rate / lvl',       max: 20, cost: (l) => Math.round(14 * Math.pow(1.55, l)) },
  { id: 'hp',     name: 'Bastion HP',      desc: '+30 base HP / lvl',         max: 20, cost: (l) => Math.round(10 * Math.pow(1.45, l)) },
  { id: 'gold',   name: 'Funding',         desc: '+15 starting gold / lvl',   max: 12, cost: (l) => Math.round(10 * Math.pow(1.6, l)) },
  { id: 'strike', name: 'Rapid Strike',    desc: '-8% strike cooldown / lvl', max: 10, cost: (l) => Math.round(20 * Math.pow(1.5, l)) },
];

export interface MetaMods {
  dmgMul: number;
  rateMul: number;
  baseHp: number;
  startGold: number;
  strikeCdMax: number;
  cannon: boolean;
  laser: boolean;
}

export function computeMods(up: Record<string, number>): MetaMods {
  const lvl = (id: string): number => up[id] ?? 0;
  return {
    dmgMul: 1 + 0.10 * lvl('dmg'),
    rateMul: 1 + 0.06 * lvl('rate'),
    baseHp: 400 + 60 * lvl('hp'),
    startGold: 350 + 40 * lvl('gold'), // must open with a real defence, not 5 guns
    strikeCdMax: 30 * Math.pow(0.92, lvl('strike')),
    cannon: true, // all towers available from the start (design decision 2026-08-15)
    laser: true,
  };
}
