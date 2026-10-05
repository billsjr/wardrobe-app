import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, space, type } from '@/theme';

export default function SignIn() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const signingUp = mode === 'sign-up';

  async function submit() {
    setBusy(true);
    const { data, error } = signingUp
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) Alert.alert(signingUp ? 'Could not sign up' : 'Could not sign in', error.message);
    else if (signingUp && !data.session) Alert.alert('Check your email', 'Tap the link we sent you, then sign in.');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        <View style={{ gap: space.sm }}>
          <Text style={type.title}>Wardrobe</Text>
          <Text style={[type.body, { color: colors.muted }]}>Your closet, and what to wear from it.</Text>
        </View>
        <View style={{ gap: space.md }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={signingUp ? 'new-password' : 'current-password'}
            textContentType={signingUp ? 'newPassword' : 'password'}
          />
        </View>
        <View style={{ gap: space.md }}>
          <Button
            title={signingUp ? 'Create account' : 'Sign in'}
            onPress={submit}
            loading={busy}
            disabled={!email || password.length < 6}
          />
          <Pressable onPress={() => setMode(signingUp ? 'sign-in' : 'sign-up')} style={{ alignSelf: 'center' }}>
            <Text style={[type.body, { color: colors.accent }]}>
              {signingUp ? 'Have an account? Sign in' : 'New here? Create an account'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: space.lg, justifyContent: 'center', gap: space.xl },
});
