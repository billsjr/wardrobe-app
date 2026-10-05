// Minimal palette: white space, black type, one accent.
export const colors = {
  background: '#FFFFFF',
  surface: '#F5F5F3',
  text: '#111111',
  muted: '#8A8A8A',
  border: '#E4E4E1',
  accent: '#2F5D50',
  danger: '#B3261E',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const type = {
  title: { fontSize: 28, fontWeight: '600' as const, color: colors.text, letterSpacing: -0.5 },
  heading: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  label: { fontSize: 13, fontWeight: '500' as const, color: colors.muted, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
};
