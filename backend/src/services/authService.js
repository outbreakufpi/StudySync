import { supabase, supabaseAdmin, createSupabaseUserClient } from '../config/supabaseClient.js';
import { ensureProfile, recordLoginMetadata } from './userContext.js';

export class AuthService {
  // Signup: Create a new user
  async signup(email, password, userData = {}) {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase().replace(/\s+/g, '');
      const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

      const { data, error } = hasServiceRole
        ? await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            password,
            email_confirm: true,
            user_metadata: userData,
          })
        : await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: userData,
            },
          });

      if (error) throw error;

      return {
        user: data.user,
        message: 'User created successfully'
      };
    } catch (error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  }

  // Login: Sign in user and return session
  async login(email, password) {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase().replace(/\s+/g, '');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) throw error;

      const userClient = createSupabaseUserClient(data.session?.access_token);
      let profile;
      try {
        profile = await recordLoginMetadata(userClient, data.user);
      } catch {
        profile = data.user?.profile || {
          id: data.user.id,
          auth_uid: data.user.id,
          email: data.user.email || null,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.fullname || data.user.user_metadata?.name || null,
          current_mode: data.user.user_metadata?.current_mode || 'university',
          metadata: data.user.user_metadata || {},
        };
      }

      return {
        user: {
          ...data.user,
          profile,
        },
        session: data.session,
        profile,
        message: 'Login successful'
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Logout: Sign out user
  async logout(accessToken) {
    try {
      const client = createSupabaseUserClient(accessToken);
      const { error } = await client.auth.signOut();

      if (error) throw error;

      return { message: 'Logout successful' };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  // Reset Password: Send reset email
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password` // Assuming frontend has reset page
      });

      if (error) throw error;

      return { message: 'Password reset email sent' };
    } catch (error) {
      throw new Error(`Reset password failed: ${error.message}`);
    }
  }

  // Validate Session: Check if token is valid (used in middleware, but can be endpoint)
  async validateSession(accessToken) {
    try {
      const client = createSupabaseUserClient(accessToken);
      const { data, error } = await client.auth.getUser(accessToken);

      if (error || !data.user) throw new Error('Invalid session');
      let profile;
      try {
        profile = await ensureProfile(client, data.user);
      } catch {
        profile = data.user?.profile || {
          id: data.user.id,
          auth_uid: data.user.id,
          email: data.user.email || null,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.fullname || data.user.user_metadata?.name || null,
          current_mode: data.user.user_metadata?.current_mode || 'university',
          metadata: data.user.user_metadata || {},
        };
      }

      return {
        user: {
          ...data.user,
          profile,
        },
        profile,
        valid: true
      };
    } catch (error) {
      throw new Error(`Session validation failed: ${error.message}`);
    }
  }

  async updateMe(accessToken, payload = {}) {
    try {
      const client = createSupabaseUserClient(accessToken);
      const { data, error } = await client.auth.getUser(accessToken);

      if (error || !data.user) throw new Error('Invalid session');

      const profile = await ensureProfile(client, data.user);
      const nextMode = payload.current_mode === 'competitive' ? 'competitive' : 'university';
      const nextMetadata = {
        ...(profile?.metadata && typeof profile.metadata === 'object' ? profile.metadata : {}),
        current_mode: nextMode,
      };

      const { data: updatedProfile, error: updateError } = await client
        .from('profiles')
        .update({
          current_mode: nextMode,
          metadata: nextMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_uid', data.user.id)
        .select('*')
        .single();

      if (updateError) {
        return {
          user: {
            ...data.user,
            profile,
          },
          profile,
          valid: true,
        };
      }

      return {
        user: {
          ...data.user,
          profile: updatedProfile,
        },
        profile: updatedProfile,
        valid: true,
      };
    } catch (error) {
      throw new Error(`Update profile failed: ${error.message}`);
    }
  }
}

export default new AuthService();