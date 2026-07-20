import type { Session, User } from '@supabase/supabase-js';

import { supabase } from './supabase';

/** True for guest (anonymous) Supabase users. */
export function isGuest(user: User | null | undefined): boolean {
  return !!user?.is_anonymous;
}

/**
 * Ensure there is an active Supabase session. If nobody is signed in, create an
 * anonymous user so the app has a real session and user_id with zero friction —
 * guests can use every feature immediately and never hit a login wall.
 */
export async function ensureSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('[auth] anonymous sign-in failed:', error.message);
    return null;
  }
  return anon.session;
}

/**
 * Upgrade the current anonymous account into a permanent one. Because we call
 * updateUser (not signUp), the user_id stays the same, so every session and the
 * streak carry over automatically — no data migration needed. Falls back to a
 * normal sign-up if there somehow is no anonymous session.
 */
export async function upgradeGuestAccount(
  email: string,
  password: string,
): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
  const { data } = await supabase.auth.getUser();

  if (data.user?.is_anonymous) {
    const { data: updated, error } = await supabase.auth.updateUser({
      email,
      password,
    });
    if (error) return { error: error.message, needsEmailConfirmation: false };
    // If the project requires email confirmation, Supabase stashes the address
    // in new_email until the user confirms it.
    const pending = !!(updated.user as { new_email?: string })?.new_email;
    return { error: null, needsEmailConfirmation: pending };
  }

  // No guest session to upgrade — behave like a regular sign-up.
  const { data: signed, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) return { error: error.message, needsEmailConfirmation: false };
  return { error: null, needsEmailConfirmation: !signed.session };
}
