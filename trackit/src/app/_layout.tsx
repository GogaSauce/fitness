import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { ensureSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/types';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Guest-first: make sure there's always a session (anonymous if needed)
    // before rendering, so nobody ever hits a login wall.
    ensureSession().finally(() => setReady(true));

    // If a registered user signs out, drop them back to a fresh guest session
    // rather than a login screen.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') ensureSession();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      {/* Both groups are always registered so the signup/login screens remain
          reachable (via the soft banner and profile) from an active session. */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}
