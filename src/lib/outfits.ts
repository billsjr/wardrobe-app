// Kept free of React Native imports so it runs under plain `node --test`.
import { NEUTRALS, type Color, type Formality, type Item, type Season } from './types.ts';

export const OCCASIONS = ['casual', 'work', 'going out', 'workout'] as const;
export type Occasion = (typeof OCCASIONS)[number];

const OCCASION_FORMALITY: Record<Occasion, Formality[]> = {
  casual: ['casual', 'smart'],
  work: ['smart', 'formal'],
  'going out': ['smart', 'formal', 'casual'],
  workout: ['sport'],
};

export type OutfitRequest = {
  occasion?: Occasion;
  season?: Season;
  /** Item ids to avoid, e.g. the last outfit shown. */
  avoid?: string[];
  /** Injected for tests; defaults to Math.random. */
  random?: () => number;
};

export type Outfit = {
  items: Item[];
  score: number;
  reason: string;
};

const MAX_CANDIDATES = 2000;

export function currentSeason(date = new Date()): Season {
  const m = date.getMonth(); // northern hemisphere
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

function fitsSeason(item: Item, season?: Season) {
  return !season || item.seasons.length === 0 || item.seasons.includes(season);
}

function fitsOccasion(item: Item, occasion?: Occasion) {
  return !occasion || OCCASION_FORMALITY[occasion].includes(item.formality);
}

function boldColors(items: Item[]): Set<Color> {
  const bold = new Set<Color>();
  for (const item of items) {
    for (const c of item.colors) if (!NEUTRALS.includes(c)) bold.add(c);
  }
  return bold;
}

/** Returns null when the colors or patterns clash, otherwise a score (higher is better). */
export function scoreOutfit(items: Item[], req: OutfitRequest = {}): number | null {
  const bold = boldColors(items);
  if (bold.size > 2 || (bold.has('multi') && bold.size > 1)) return null;
  const patterned = items.filter((i) => i.pattern !== 'solid' && i.category !== 'accessory');
  if (patterned.length > 1) return null;

  let score = 0;
  // One pop of color on a neutral base reads as intentional.
  if (bold.size === 1) score += 1;
  for (const item of items) {
    if (req.occasion && OCCASION_FORMALITY[req.occasion][0] === item.formality) score += 2;
    if (req.season && item.seasons.includes(req.season)) score += 1;
    if (req.avoid?.includes(item.id)) score -= 3;
  }
  // Prefer outfits whose pieces share a formality level.
  if (new Set(items.map((i) => i.formality)).size === 1) score += 1;
  return score;
}

function describe(items: Item[], req: OutfitRequest): string {
  const bold = [...boldColors(items)];
  const parts: string[] = [];
  parts.push(bold.length === 0 ? 'All neutrals, so everything goes together' : `Neutral base with a pop of ${bold.join(' and ')}`);
  if (req.occasion) parts.push(`suited to ${req.occasion}`);
  if (req.season) parts.push(`works for ${req.season}`);
  return parts.join(', ') + '.';
}

export function suggestOutfit(wardrobe: Item[], req: OutfitRequest = {}): Outfit | null {
  const random = req.random ?? Math.random;
  const usable = wardrobe.filter((i) => fitsSeason(i, req.season));
  const pick = (category: Item['category']) => {
    const all = usable.filter((i) => i.category === category);
    const matching = all.filter((i) => fitsOccasion(i, req.occasion));
    // Fall back to the whole category so a small closet still gets an outfit.
    return matching.length > 0 ? matching : all;
  };

  const tops = pick('top');
  const bottoms = pick('bottom');
  const dresses = pick('dress');
  const shoes = pick('shoes');
  const outer = pick('outerwear');

  const bases: Item[][] = [];
  for (const t of tops) for (const b of bottoms) bases.push([t, b]);
  for (const d of dresses) bases.push([d]);
  if (bases.length === 0) return null;

  const wantsLayer = req.season === 'autumn' || req.season === 'winter';
  const shoeOptions: (Item | null)[] = shoes.length > 0 ? shoes : [null];
  const layerOptions: (Item | null)[] = wantsLayer && outer.length > 0 ? outer : [null];

  const candidates: Outfit[] = [];
  search: for (const base of bases) {
    for (const s of shoeOptions) {
      for (const l of layerOptions) {
        const items = [...base, ...(l ? [l] : []), ...(s ? [s] : [])];
        const score = scoreOutfit(items, req);
        if (score !== null) candidates.push({ items, score, reason: describe(items, req) });
        if (candidates.length >= MAX_CANDIDATES) break search;
      }
    }
  }
  if (candidates.length === 0) return null;

  // Pick randomly among the best few so repeated taps give variety.
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0].score;
  const top = candidates.filter((c) => c.score >= best - 1).slice(0, 10);
  return top[Math.floor(random() * top.length)];
}
