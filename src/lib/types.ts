export const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'] as const;
export type Category = (typeof CATEGORIES)[number];

export const COLORS = [
  'black',
  'white',
  'grey',
  'beige',
  'brown',
  'navy',
  'denim',
  'blue',
  'green',
  'olive',
  'red',
  'pink',
  'purple',
  'yellow',
  'orange',
  'multi',
] as const;
export type Color = (typeof COLORS)[number];

// Colors that go with anything. Outfits can mix these freely.
export const NEUTRALS: readonly Color[] = ['black', 'white', 'grey', 'beige', 'brown', 'navy', 'denim'];

export const PATTERNS = ['solid', 'striped', 'checked', 'floral', 'graphic', 'other'] as const;
export type Pattern = (typeof PATTERNS)[number];

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const FORMALITIES = ['casual', 'smart', 'formal', 'sport'] as const;
export type Formality = (typeof FORMALITIES)[number];

export type ItemTags = {
  category: Category;
  subcategory: string;
  colors: Color[];
  pattern: Pattern;
  seasons: Season[];
  formality: Formality;
};

export type Item = ItemTags & {
  id: string;
  user_id: string;
  photo_path: string;
  created_at: string;
  /** Signed URL for display, filled in when items are loaded. */
  photo_url?: string;
};

export const EMPTY_TAGS: ItemTags = {
  category: 'top',
  subcategory: '',
  colors: [],
  pattern: 'solid',
  seasons: [],
  formality: 'casual',
};
