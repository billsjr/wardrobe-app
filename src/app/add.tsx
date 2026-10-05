import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TagEditor } from '@/components/TagEditor';
import { Button } from '@/components/ui';
import { createItem, preparePhoto, suggestTags, type PreparedPhoto } from '@/lib/items';
import type { ItemTags } from '@/lib/types';
import { colors, space, type } from '@/theme';

export default function AddItem() {
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [tags, setTags] = useState<ItemTags | null>(null);
  const [autoTagged, setAutoTagged] = useState(false);
  const [working, setWorking] = useState<'tagging' | 'saving' | null>(null);

  async function pick(source: 'camera' | 'library') {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph your clothes.');
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 1 };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;

    setWorking('tagging');
    try {
      const prepared = await preparePhoto(result.assets[0].uri);
      setPhoto(prepared);
      const suggestion = await suggestTags(prepared);
      setTags(suggestion.tags);
      setAutoTagged(suggestion.auto);
    } catch (e) {
      Alert.alert('Could not use that photo', e instanceof Error ? e.message : String(e));
    } finally {
      setWorking(null);
    }
  }

  async function save() {
    if (!photo || !tags) return;
    setWorking('saving');
    try {
      await createItem(photo, tags);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
      setWorking(null);
    }
  }

  if (!photo) {
    return (
      <View style={[styles.screen, styles.center]}>
        {working ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <View style={{ gap: space.md, alignSelf: 'stretch' }}>
            <Text style={[type.body, { color: colors.muted, textAlign: 'center' }]}>
              Lay the item flat or hang it up against a plain background.
            </Text>
            <Button title="Take photo" onPress={() => pick('camera')} />
            <Button title="Choose from library" variant="secondary" onPress={() => pick('library')} />
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image source={photo.uri} style={styles.photo} contentFit="cover" />
      {working === 'tagging' || !tags ? (
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <ActivityIndicator color={colors.text} />
          <Text style={[type.body, { color: colors.muted }]}>Reading the photo…</Text>
        </View>
      ) : (
        <>
          <Text style={[type.body, { color: colors.muted }]}>
            {autoTagged ? 'Check the tags and fix anything that looks off.' : 'Add a few tags so outfits can use this item.'}
          </Text>
          <TagEditor tags={tags} onChange={setTags} />
          <Button title="Save to closet" onPress={save} loading={working === 'saving'} disabled={tags.colors.length === 0} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: space.lg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  photo: { width: '60%', alignSelf: 'center', aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: colors.surface },
});
