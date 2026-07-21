import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export interface UserProfile {
    id: string;
    email: string | null;
    full_name: string | null;
    phone: string | null;
}

export const usersService = {
  /**
   * Upsert the authenticated user's profile row into public.users.
   * Called after SIGNED_IN and on session restore so returning users stay in sync.
   */
  async syncProfile(user: User): Promise<void> {
    const payload: UserProfile = {
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      phone: null, // Google OAuth does not supply a phone number
    };

    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error(
        '[users.syncProfile] error:',
        error.message,
        '| code:', error.code,
        '| details:', error.details,
        '| hint:', error.hint,
      );
    }
  },
};
