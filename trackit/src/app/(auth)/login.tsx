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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) setError(err.message);
    // On success the auth gate in the root layout switches to (tabs).
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-background px-6"
    >
      <Text className="text-4xl font-black text-primary">TrackIt</Text>
      <Text className="mb-10 mt-2 text-base text-secondary">
        Log the work. Keep the streak.
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
        placeholder="Password"
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text className="mb-3 text-sm text-red-400">{error}</Text>}

      <TouchableOpacity
        className="items-center rounded-xl bg-primary py-4"
        disabled={loading || !email || !password}
        onPress={signIn}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Log In</Text>
        )}
      </TouchableOpacity>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-secondary">No account? </Text>
        <Link href="/signup" className="font-semibold text-primary">
          Sign up
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
