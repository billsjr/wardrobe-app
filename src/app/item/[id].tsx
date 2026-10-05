import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { TagEditor } from '@/components/TagEditor';
import { Button } from '@/components/ui';
import { deleteItem, getItem, updateItem } from '@/lib/items';
import type { Item, ItemTags } from '@/lib/types';
import { colors, space } from '@/theme';

function tagsOf(item: Item): ItemTags {
  const { category, subcategory, colors, pattern, seasons, formality } = item;
  return { category, subcategory, colors, pattern, seasons, formality };
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [tags, setTags] = useState<ItemTags | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getItem(id)
      .then((loaded) => {
        setItem(loaded);
        setTags(tagsOf(loaded));
      })
      .catch((e) => {
        Alert.alert('Could not load item', e instanceof Error ? e.message : String(e));
        router.back();
      });
  }, [id]);

  if (!item || !tags) {
    return (
      <View style={[styles.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  const changed = JSON.stringify(tags) !== JSON.stringify(tagsOf(item));

  async function save() {
    if (!tags) return;
    setSaving(true);
    try {
      await updateItem(id, tags);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete this item?', 'It will be removed from your closet.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(item!);
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image source={item.photo_url} style={styles.photo} contentFit="cover" />
      <TagEditor tags={tags} onChange={setTags} />
      <Button title="Save changes" onPress={save} loading={saving} disabled={!changed} />
      <Button title="Delete item" variant="danger" onPress={confirmDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  photo: { width: '70%', alignSelf: 'center', aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: colors.surface },
});
