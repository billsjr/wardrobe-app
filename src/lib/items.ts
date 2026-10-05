import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { PHOTO_BUCKET, supabase } from './supabase';
import { EMPTY_TAGS, type Item, type ItemTags } from './types';

const COLUMNS = 'id, user_id, photo_path, category, subcategory, colors, pattern, seasons, formality, created_at';

export type PreparedPhoto = { uri: string; base64: string };

/** Shrinks a picked photo to a size that uploads fast and is plenty for tagging. */
export async function preparePhoto(uri: string): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 1024 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!result.base64) throw new Error('Could not read the photo.');
  return { uri: result.uri, base64: result.base64 };
}

/**
 * Asks the tag-item edge function (Claude vision) to tag the photo.
 * Returns empty tags if tagging is unavailable so the user can fill them in by hand.
 */
export async function suggestTags(photo: PreparedPhoto): Promise<{ tags: ItemTags; auto: boolean }> {
  const { data, error } = await supabase.functions.invoke<{ tags: ItemTags }>('tag-item', {
    body: { image: photo.base64, mediaType: 'image/jpeg' },
  });
  if (error || !data?.tags) {
    console.warn('Auto-tagging unavailable', error);
    return { tags: EMPTY_TAGS, auto: false };
  }
  return { tags: data.tags, auto: true };
}

async function withPhotoUrls(items: Item[]): Promise<Item[]> {
  if (items.length === 0) return items;
  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(items.map((i) => i.photo_path), 60 * 60);
  const urls = new Map(data?.map((d) => [d.path, d.signedUrl]));
  return items.map((i) => ({ ...i, photo_url: urls.get(i.photo_path) ?? undefined }));
}

export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase.from('items').select(COLUMNS).order('created_at', { ascending: false });
  if (error) throw error;
  return withPhotoUrls(data as Item[]);
}

export async function getItem(id: string): Promise<Item> {
  const { data, error } = await supabase.from('items').select(COLUMNS).eq('id', id).single();
  if (error) throw error;
  const [item] = await withPhotoUrls([data as Item]);
  return item;
}

export async function createItem(photo: PreparedPhoto, tags: ItemTags): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('You need to be signed in.');

  // Photos live under the user's own folder; storage policies enforce this.
  const path = `${userId}/${Date.now()}.jpg`;
  const body = await fetch(photo.uri).then((r) => r.arrayBuffer());
  const upload = await supabase.storage.from(PHOTO_BUCKET).upload(path, body, { contentType: 'image/jpeg' });
  if (upload.error) throw upload.error;

  const { error } = await supabase.from('items').insert({ ...tags, user_id: userId, photo_path: path });
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw error;
  }
}

export async function updateItem(id: string, tags: ItemTags): Promise<void> {
  const { error } = await supabase.from('items').update(tags).eq('id', id);
  if (error) throw error;
}

export async function deleteItem(item: Item): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', item.id);
  if (error) throw error;
  await supabase.storage.from(PHOTO_BUCKET).remove([item.photo_path]);
}
