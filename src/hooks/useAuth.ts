import { useState, useEffect } from 'react';
import type { UserProfile } from '../firebase/firestoreTypes';
import {
  getCurrentUserSession,
  loginUser,
  registerUser,
  logoutUser,
  switchDemoUser,
  DEMO_USERS,
} from '../services/authService';
import { subscribeRealtime } from '../services/dbStore';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUserSession());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state change across tabs/actions
    const unsubscribe = subscribeRealtime('auth_state_change', (updatedUser: UserProfile | null) => {
      setCurrentUser(updatedUser);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginUser(email, pass);
      setCurrentUser(user);
      return user;
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (params: {
    name: string;
    email: string;
    password: string;
    role: 'organizer' | 'attendee';
  }) => {
    setLoading(true);
    setError(null);
    try {
      const user = await registerUser(params);
      setCurrentUser(user);
      return user;
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = (uid: string) => {
    const user = switchDemoUser(uid);
    setCurrentUser(user);
  };

  return {
    currentUser,
    role: currentUser?.role || null,
    isOrganizer: currentUser?.role === 'organizer',
    isAttendee: currentUser?.role === 'attendee',
    isAuthenticated: Boolean(currentUser),
    demoUsers: DEMO_USERS,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    switchDemoUser: handleSwitchUser,
  };
}
