import { Image } from 'expo-image';
import { Link, router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Chips } from '@/components/ui';
import { listItems } from '@/lib/items';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, COLORS, type Category, type Color, type Item } from '@/lib/types';
import { colors, space, type } from '@/theme';

export default function Closet() {
  const navigation = useNavigation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [color, setColor] = useState<Color | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listItems());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your closet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => supabase.auth.signOut()} style={{ paddingHorizontal: space.md }}>
          <Text style={[type.body, { color: colors.muted }]}>Sign out</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const shown = useMemo(
    () => items.filter((i) => (!category || i.category === category) && (!color || i.colors.includes(color))),
    [items, category, color],
  );
  const usedColors = useMemo(() => COLORS.filter((c) => items.some((i) => i.colors.includes(c))), [items]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={shown}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: space.md }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={{ gap: space.md, marginBottom: space.md }}>
              <Chips options={CATEGORIES} selected={category ? [category] : []} onToggle={(c) => setCategory(c === category ? null : c)} />
              {usedColors.length > 1 ? (
                <Chips options={usedColors} selected={color ? [color] : []} onToggle={(c) => setColor(c === color ? null : c)} />
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={type.heading}>{error ? 'Something went wrong' : items.length ? 'Nothing matches' : 'Your closet is empty'}</Text>
              <Text style={[type.body, { color: colors.muted, textAlign: 'center' }]}>
                {error ?? (items.length ? 'Try a different filter.' : 'Add your first item by taking a photo of it.')}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: '/item/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.card}>
              <Image source={item.photo_url} style={styles.photo} contentFit="cover" transition={150} />
              <Text style={styles.caption} numberOfLines={1}>
                {item.subcategory || item.category}
              </Text>
            </Pressable>
          </Link>
        )}
      />
      <View style={styles.footer}>
        <Button title="Add item" onPress={() => router.push('/add')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: space.md, paddingBottom: 100, gap: space.md },
  card: { flex: 1, maxWidth: '50%', gap: space.xs },
  photo: { aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: colors.surface },
  caption: { fontSize: 14, color: colors.text, textTransform: 'capitalize' },
  empty: { alignItems: 'center', gap: space.sm, paddingTop: 120, paddingHorizontal: space.lg },
  footer: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.md },
});
