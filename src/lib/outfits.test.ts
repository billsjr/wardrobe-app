/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { currentSeason, scoreOutfit, suggestOutfit } from './outfits.ts';
import type { Item, ItemTags } from './types.ts';

let nextId = 0;
function item(tags: Partial<ItemTags>): Item {
  nextId += 1;
  return {
    id: `item-${nextId}`,
    user_id: 'user-1',
    photo_path: `user-1/${nextId}.jpg`,
    created_at: '2026-10-05T00:00:00Z',
    category: 'top',
    subcategory: '',
    colors: ['white'],
    pattern: 'solid',
    seasons: [],
    formality: 'casual',
    ...tags,
  };
}

const first = () => 0;

test('returns null for an empty wardrobe', () => {
  assert.equal(suggestOutfit([]), null);
});

test('returns null without a top and bottom or a dress', () => {
  assert.equal(suggestOutfit([item({ category: 'top' }), item({ category: 'shoes' })]), null);
});

test('builds top + bottom + shoes', () => {
  const top = item({ category: 'top' });
  const bottom = item({ category: 'bottom', colors: ['denim'] });
  const shoes = item({ category: 'shoes', colors: ['black'] });
  const outfit = suggestOutfit([top, bottom, shoes], { random: first });
  assert.deepEqual(outfit?.items.map((i) => i.id), [top.id, bottom.id, shoes.id]);
});

test('a dress alone is a valid base', () => {
  const dress = item({ category: 'dress', colors: ['black'] });
  assert.deepEqual(suggestOutfit([dress], { random: first })?.items, [dress]);
});

test('adds a layer in winter but not in summer', () => {
  const wardrobe = [
    item({ category: 'top' }),
    item({ category: 'bottom', colors: ['black'] }),
    item({ category: 'outerwear', colors: ['navy'] }),
  ];
  const winter = suggestOutfit(wardrobe, { season: 'winter', random: first });
  const summer = suggestOutfit(wardrobe, { season: 'summer', random: first });
  assert.ok(winter?.items.some((i) => i.category === 'outerwear'));
  assert.ok(!summer?.items.some((i) => i.category === 'outerwear'));
});

test('skips items tagged for other seasons', () => {
  const coatTop = item({ category: 'top', seasons: ['winter'] });
  const tee = item({ category: 'top', seasons: ['summer'] });
  const shorts = item({ category: 'bottom', colors: ['beige'] });
  const outfit = suggestOutfit([coatTop, tee, shorts], { season: 'summer', random: first });
  assert.equal(outfit?.items[0].id, tee.id);
});

test('prefers items matching the occasion', () => {
  const tee = item({ category: 'top', formality: 'casual' });
  const shirt = item({ category: 'top', formality: 'smart' });
  const trousers = item({ category: 'bottom', colors: ['grey'], formality: 'smart' });
  for (let i = 0; i < 5; i++) {
    const outfit = suggestOutfit([tee, shirt, trousers], { occasion: 'work', random: Math.random });
    assert.equal(outfit?.items[0].id, shirt.id);
  }
});

test('falls back to any item when nothing matches the occasion', () => {
  const tee = item({ category: 'top', formality: 'casual' });
  const jeans = item({ category: 'bottom', colors: ['denim'], formality: 'casual' });
  assert.ok(suggestOutfit([tee, jeans], { occasion: 'workout', random: first }));
});

test('rejects more than two bold colors', () => {
  const outfit = [
    item({ category: 'top', colors: ['red'] }),
    item({ category: 'bottom', colors: ['green'] }),
    item({ category: 'shoes', colors: ['yellow'] }),
  ];
  assert.equal(scoreOutfit(outfit), null);
});

test('rejects two patterned pieces', () => {
  const outfit = [
    item({ category: 'top', pattern: 'striped' }),
    item({ category: 'bottom', pattern: 'checked', colors: ['grey'] }),
  ];
  assert.equal(scoreOutfit(outfit), null);
});

test('avoids clashing combinations when a clean one exists', () => {
  const red = item({ category: 'top', colors: ['red'], pattern: 'floral' });
  const white = item({ category: 'top', colors: ['white'] });
  const plaid = item({ category: 'bottom', colors: ['green'], pattern: 'checked' });
  const outfit = suggestOutfit([red, white, plaid], { random: first });
  assert.equal(outfit?.items[0].id, white.id);
});

test('currentSeason maps months to northern seasons', () => {
  assert.equal(currentSeason(new Date(2026, 0, 15)), 'winter');
  assert.equal(currentSeason(new Date(2026, 3, 15)), 'spring');
  assert.equal(currentSeason(new Date(2026, 6, 15)), 'summer');
  assert.equal(currentSeason(new Date(2026, 9, 15)), 'autumn');
});
