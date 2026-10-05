import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Chips } from '@/components/ui';
import { listItems } from '@/lib/items';
import { currentSeason, OCCASIONS, suggestOutfit, type Occasion, type Outfit } from '@/lib/outfits';
import { SEASONS, type Item, type Season } from '@/lib/types';
import { colors, space, type } from '@/theme';

export default function OutfitScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [occasion, setOccasion] = useState<Occasion>('casual');
  const [season, setSeason] = useState<Season>(currentSeason());
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [tried, setTried] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listItems().then(setItems).catch(() => setItems([]));
    }, []),
  );

  function suggest() {
    setOutfit(suggestOutfit(items, { occasion, season, avoid: outfit?.items.map((i) => i.id) }));
    setTried(true);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Chips label="Occasion" options={OCCASIONS} selected={[occasion]} onToggle={setOccasion} />
      <Chips label="Season" options={SEASONS} selected={[season]} onToggle={setSeason} />
      <Button title={outfit ? 'Try another' : 'Suggest an outfit'} onPress={suggest} disabled={items.length === 0} />

      {outfit ? (
        <View style={{ gap: space.md }}>
          <Text style={[type.body, { color: colors.muted }]}>{outfit.reason}</Text>
          <View style={styles.grid}>
            {outfit.items.map((item) => (
              <View key={item.id} style={styles.piece}>
                <Image source={item.photo_url} style={styles.photo} contentFit="cover" />
                <Text style={styles.caption}>{item.subcategory || item.category}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : tried ? (
        <Text style={[type.body, { color: colors.muted }]}>
          Not enough to make an outfit yet. Add at least a top and a bottom, or a dress.
        </Text>
      ) : items.length === 0 ? (
        <Text style={[type.body, { color: colors.muted }]}>Add some clothes to your closet first.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  piece: { width: '47%', gap: space.xs },
  photo: { aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: colors.surface },
  caption: { fontSize: 14, color: colors.text, textTransform: 'capitalize' },
});
