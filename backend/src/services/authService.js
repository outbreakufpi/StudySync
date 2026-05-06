import { supabase, supabaseAdmin } from '../config/supabaseClient.js';

export class AuthService {
  // Signup: Create a new user
  async signup(email, password, userData = {}) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for simplicity
        user_metadata: userData
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return {
        user: data.user,
        session: data.session,
        message: 'Login successful'
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Logout: Sign out user
  async logout(accessToken) {
    try {
      // For server-side logout, we can use the admin client
      const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);

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
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error || !data.user) throw new Error('Invalid session');

      return {
        user: data.user,
        valid: true
      };
    } catch (error) {
      throw new Error(`Session validation failed: ${error.message}`);
    }
  }
}

export default new AuthService();