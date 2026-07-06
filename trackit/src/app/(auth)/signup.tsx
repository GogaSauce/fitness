import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else if (!data.session) {
      // Email confirmation is enabled on the Supabase project.
      setNotice('Check your email to confirm your account, then log in.');
    }
    // With confirmation disabled, a session comes back and the auth gate
    // in the root layout switches straight to (tabs).
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-background px-6"
    >
      <Text className="text-4xl font-black text-primary">Create account</Text>
      <Text className="mb-10 mt-2 text-base text-secondary">
        Every session counts. Start today.
      </Text>

      <TextInput
        className="mb-4 rounded-xl border border-line bg-card px-4 py-4 text-base text-white"
        placeholder="Email"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="mb-4 rounded-xl border border-line bg-card px-4 py-4 text-base text-white"
        placeholder="Password (min 6 characters)"
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text className="mb-3 text-sm text-red-400">{error}</Text>}
      {notice && <Text className="mb-3 text-sm text-cardio">{notice}</Text>}

      <TouchableOpacity
        className="items-center rounded-xl bg-primary py-4"
        disabled={loading || !email || password.length < 6}
        onPress={signUp}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Sign Up</Text>
        )}
      </TouchableOpacity>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-secondary">Already have an account? </Text>
        <Link href="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
