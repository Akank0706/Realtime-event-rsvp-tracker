/**
 * Authentication Service
 * Manages user registration, login, role determination, and session persistence.
 * Uses Firebase Auth when configured, with synchronized user documents in Firestore.
 */

import type { UserProfile, UserRole } from '../firebase/firestoreTypes';
import {
  getLocalCollection,
  setLocalCollection,
  STORAGE_KEYS,
  notifyRealtimeListeners,
  seedInitialDataIfNeeded,
} from './dbStore';
import { isFirebaseConfigured, auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CURRENT_USER_SESSION_KEY = 'rsvp_cloud_current_user';

export const DEMO_USERS: UserProfile[] = [
  {
    uid: 'user_alex_organizer',
    name: 'Alex Rivera',
    email: 'alex.organizer@campuscloud.edu',
    role: 'organizer',
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    uid: 'user_sam_attendee',
    name: 'Sam Chen',
    email: 'sam.attendee@campuscloud.edu',
    role: 'attendee',
    createdAt: '2026-09-21T11:00:00.000Z',
  },
  {
    uid: 'user_taylor_attendee',
    name: 'Taylor Jordan',
    email: 'taylor.attendee@campuscloud.edu',
    role: 'attendee',
    createdAt: '2026-09-22T14:30:00.000Z',
  },
];

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<UserProfile> {
  const { name, email, password, role } = params;

  if (!name.trim()) throw new Error('Full name is required.');
  if (!email.trim() || !email.includes('@')) throw new Error('A valid email address is required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (role !== 'organizer' && role !== 'attendee') throw new Error('Role must be organizer or attendee.');

  seedInitialDataIfNeeded();

  if (isFirebaseConfigured && auth && db) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const userProfile: UserProfile = {
        uid: userCred.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userCred.user.uid), userProfile);
      setCurrentUserSession(userProfile);
      return userProfile;
    } catch (firebaseErr: any) {
      if (firebaseErr.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email address already exists.');
      }
      throw new Error(firebaseErr.message || 'Firebase registration failed.');
    }
  }

  // Local / Simulated Cloud Database Flow
  const users = getLocalCollection<UserProfile>(STORAGE_KEYS.USERS);
  const normalizedEmail = email.trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const newProfile: UserProfile = {
    uid: 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
    name: name.trim(),
    email: normalizedEmail,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newProfile);
  setLocalCollection(STORAGE_KEYS.USERS, users);
  setCurrentUserSession(newProfile);
  return newProfile;
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
  if (!email.trim()) throw new Error('Email is required.');
  if (!password) throw new Error('Password is required.');

  seedInitialDataIfNeeded();

  if (isFirebaseConfigured && auth && db) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        setCurrentUserSession(profile);
        return profile;
      }
      // If user profile doc missing, create default attendee
      const fallbackProfile: UserProfile = {
        uid: cred.user.uid,
        name: cred.user.displayName || email.split('@')[0],
        email: cred.user.email || email,
        role: 'attendee',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), fallbackProfile);
      setCurrentUserSession(fallbackProfile);
      return fallbackProfile;
    } catch (firebaseErr: any) {
      if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password.');
      }
      throw new Error(firebaseErr.message || 'Authentication error.');
    }
  }

  const users = getLocalCollection<UserProfile>(STORAGE_KEYS.USERS);
  const normalizedEmail = email.trim().toLowerCase();
  const matched = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!matched) {
    throw new Error('Invalid email or credentials. Use a registered email or select a Demo Profile.');
  }

  setCurrentUserSession(matched);
  return matched;
}

export function getCurrentUserSession(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  seedInitialDataIfNeeded();
  try {
    const raw = localStorage.getItem(CURRENT_USER_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading user session:', e);
  }

  // Default to Sam Attendee for initial preview if none set
  const defaultUser = DEMO_USERS[0];
  setCurrentUserSession(defaultUser);
  return defaultUser;
}

export function setCurrentUserSession(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(user));
  }
  notifyRealtimeListeners('auth_state_change', user);
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase signout warning:', err);
    }
  }
  setCurrentUserSession(null);
}

export function switchDemoUser(uid: string): UserProfile {
  seedInitialDataIfNeeded();
  const users = getLocalCollection<UserProfile>(STORAGE_KEYS.USERS);
  let target = users.find((u) => u.uid === uid) || DEMO_USERS.find((u) => u.uid === uid);

  if (!target) {
    target = DEMO_USERS[0];
  }

  setCurrentUserSession(target);
  return target;
}
