import { View } from 'react-native';

import { CATEGORIES, COLORS, FORMALITIES, PATTERNS, SEASONS, type ItemTags } from '@/lib/types';
import { space } from '@/theme';
import { Chips, Field } from './ui';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function TagEditor({ tags, onChange }: { tags: ItemTags; onChange: (tags: ItemTags) => void }) {
  const set = (patch: Partial<ItemTags>) => onChange({ ...tags, ...patch });
  return (
    <View style={{ gap: space.lg }}>
      <Chips label="Type" options={CATEGORIES} selected={[tags.category]} onToggle={(category) => set({ category })} />
      <Field
        label="What is it?"
        placeholder="e.g. t-shirt, jeans, trainers"
        value={tags.subcategory}
        onChangeText={(subcategory) => set({ subcategory })}
        autoCapitalize="none"
      />
      <Chips label="Colors" options={COLORS} selected={tags.colors} onToggle={(c) => set({ colors: toggle(tags.colors, c) })} />
      <Chips label="Pattern" options={PATTERNS} selected={[tags.pattern]} onToggle={(pattern) => set({ pattern })} />
      <Chips
        label="Seasons (none means all year)"
        options={SEASONS}
        selected={tags.seasons}
        onToggle={(s) => set({ seasons: toggle(tags.seasons, s) })}
      />
      <Chips label="Style" options={FORMALITIES} selected={[tags.formality]} onToggle={(formality) => set({ formality })} />
    </View>
  );
}
