/**
 * Cloud Database & Real-Time Sync Service
 * Supports Cloud Firestore when configured, and features a built-in
 * real-time BroadcastChannel & localStorage persistence engine that
 * functions identically to Firestore real-time listeners across browser windows/tabs.
 */

import { db, isFirebaseConfigured } from '../firebase/config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  runTransaction as firestoreRunTransaction,
} from 'firebase/firestore';
import type {
  EventData,
  RsvpRecord,
  WaitlistRecord,
  AnnouncementRecord,
  NotificationRecord,
  UserProfile,
} from '../firebase/firestoreTypes';

const STORAGE_KEYS = {
  USERS: 'rsvp_cloud_users',
  EVENTS: 'rsvp_cloud_events',
  RSVPS: 'rsvp_cloud_rsvps',
  WAITLIST: 'rsvp_cloud_waitlist',
  ANNOUNCEMENTS: 'rsvp_cloud_announcements',
  NOTIFICATIONS: 'rsvp_cloud_notifications',
};

// Cross-tab real-time event bus
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('rsvp-tracker-realtime-bus')
  : null;

type ListenerCallback = (data: any) => void;
const listeners = new Map<string, Set<ListenerCallback>>();

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const { key, payload } = event.data || {};
    if (key && listeners.has(key)) {
      listeners.get(key)?.forEach((cb) => cb(payload));
    }
  };
}

export function notifyRealtimeListeners(key: string, payload: any) {
  if (listeners.has(key)) {
    listeners.get(key)?.forEach((cb) => cb(payload));
  }
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ key, payload });
    } catch {
      // Ignored if detached
    }
  }
}

export function subscribeRealtime(key: string, callback: ListenerCallback): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);

  return () => {
    const set = listeners.get(key);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        listeners.delete(key);
      }
    }
  };
}

// In-memory fallback for Node.js / CLI execution environments
const nodeMemoryStore = new Map<string, string>();

// Local Storage Helpers
export function getLocalCollection<T>(key: string): T[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }
    const raw = nodeMemoryStore.get(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return [];
  }
}

export function setLocalCollection<T>(key: string, items: T[]): void {
  try {
    const serialized = JSON.stringify(items);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, serialized);
    } else {
      nodeMemoryStore.set(key, serialized);
    }
    notifyRealtimeListeners(key, items);
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Initial Sample Seeding (Synthetic Data for student viva and demonstration)
export function seedInitialDataIfNeeded() {
  const existingUsers = getLocalCollection<UserProfile>(STORAGE_KEYS.USERS);
  if (existingUsers.length === 0) {
    const sampleUsers: UserProfile[] = [
      {
        uid: 'user_alex_organizer',
        name: 'Alex Rivera',
        email: 'alex.organizer@campuscloud.edu',
        role: 'organizer',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        uid: 'user_sam_attendee',
        name: 'Sam Chen',
        email: 'sam.attendee@campuscloud.edu',
        role: 'attendee',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        uid: 'user_taylor_attendee',
        name: 'Taylor Jordan',
        email: 'taylor.attendee@campuscloud.edu',
        role: 'attendee',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];
    setLocalCollection(STORAGE_KEYS.USERS, sampleUsers);
  }

  const existingEvents = getLocalCollection<EventData>(STORAGE_KEYS.EVENTS);
  if (existingEvents.length === 0) {
    const sampleEvents: EventData[] = [
      {
        id: 'evt_cloud_summit_2026',
        organizerId: 'user_alex_organizer',
        organizerName: 'Alex Rivera',
        organizerEmail: 'alex.organizer@campuscloud.edu',
        title: 'Cloud Computing & Serverless Architecture Workshop',
        description:
          'Deep dive into Firestore real-time listeners, serverless functions, atomic transactions, and fault-tolerant cloud design for modern distributed applications.',
        category: 'Workshop',
        location: 'Computer Science Complex, Hall B3 & Virtual Live Stream',
        date: '2026-10-15',
        startTime: '10:00',
        endTime: '13:00',
        capacity: 50,
        goingCount: 2,
        maybeCount: 1,
        notGoingCount: 0,
        waitlistCount: 0,
        status: 'PUBLISHED',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'evt_ai_dev_symposium',
        organizerId: 'user_alex_organizer',
        organizerName: 'Alex Rivera',
        organizerEmail: 'alex.organizer@campuscloud.edu',
        title: 'Full-Stack Distributed Systems Symposium',
        description:
          'Technical seminar covering race condition resolution, optimistic concurrency, and WebSocket/onSnapshot stream synchronization across browser clusters.',
        category: 'Seminar',
        location: 'Auditorium 1, Tech Innovation Hub',
        date: '2026-10-22',
        startTime: '14:00',
        endTime: '17:30',
        capacity: 3, // Low capacity to easily demonstrate waitlist & FULL status
        goingCount: 3,
        maybeCount: 0,
        notGoingCount: 0,
        waitlistCount: 1,
        status: 'FULL',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'evt_campus_hackathon',
        organizerId: 'user_alex_organizer',
        organizerName: 'Alex Rivera',
        organizerEmail: 'alex.organizer@campuscloud.edu',
        title: 'Annual Campus Hackathon & Code Fest',
        description:
          'Build collaborative cloud web apps in 24 hours. Teams get access to cloud credits, mentorship, and live judging.',
        category: 'College Event',
        location: 'Student Activity Center, Great Hall',
        date: '2026-11-05',
        startTime: '09:00',
        endTime: '21:00',
        capacity: 100,
        goingCount: 1,
        maybeCount: 0,
        notGoingCount: 0,
        waitlistCount: 0,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setLocalCollection(STORAGE_KEYS.EVENTS, sampleEvents);

    const sampleRsvps: RsvpRecord[] = [
      {
        id: 'rsvp_sample_1',
        eventId: 'evt_cloud_summit_2026',
        userId: 'user_sam_attendee',
        userName: 'Sam Chen',
        userEmail: 'sam.attendee@campuscloud.edu',
        status: 'GOING',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'rsvp_sample_2',
        eventId: 'evt_cloud_summit_2026',
        userId: 'user_taylor_attendee',
        userName: 'Taylor Jordan',
        userEmail: 'taylor.attendee@campuscloud.edu',
        status: 'GOING',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'rsvp_sample_3',
        eventId: 'evt_ai_dev_symposium',
        userId: 'user_sam_attendee',
        userName: 'Sam Chen',
        userEmail: 'sam.attendee@campuscloud.edu',
        status: 'GOING',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'rsvp_sample_4',
        eventId: 'evt_ai_dev_symposium',
        userId: 'user_taylor_attendee',
        userName: 'Taylor Jordan',
        userEmail: 'taylor.attendee@campuscloud.edu',
        status: 'GOING',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'rsvp_sample_5',
        eventId: 'evt_ai_dev_symposium',
        userId: 'user_alex_organizer',
        userName: 'Alex Rivera',
        userEmail: 'alex.organizer@campuscloud.edu',
        status: 'GOING',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'rsvp_sample_6',
        eventId: 'evt_campus_hackathon',
        userId: 'user_sam_attendee',
        userName: 'Sam Chen',
        userEmail: 'sam.attendee@campuscloud.edu',
        status: 'GOING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setLocalCollection(STORAGE_KEYS.RSVPS, sampleRsvps);

    const sampleWaitlist: WaitlistRecord[] = [
      {
        id: 'wl_sample_1',
        eventId: 'evt_ai_dev_symposium',
        userId: 'user_morgan_demo',
        userName: 'Morgan Reed',
        userEmail: 'morgan.reed@campuscloud.edu',
        joinedAt: new Date().toISOString(),
        position: 1,
        status: 'WAITING',
      },
    ];
    setLocalCollection(STORAGE_KEYS.WAITLIST, sampleWaitlist);

    const sampleNotifications: NotificationRecord[] = [
      {
        id: 'notif_sample_1',
        userId: 'user_sam_attendee',
        type: 'RSVP_CONFIRMATION',
        title: 'RSVP Confirmed: GOING',
        message: 'You have reserved a confirmed seat for "Cloud Computing & Serverless Architecture Workshop".',
        eventId: 'evt_cloud_summit_2026',
        eventTitle: 'Cloud Computing & Serverless Architecture Workshop',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'notif_sample_2',
        userId: 'user_alex_organizer',
        type: 'RSVP_CHANGED',
        title: 'New RSVP Received',
        message: 'Taylor Jordan marked GOING for "Cloud Computing & Serverless Architecture Workshop".',
        eventId: 'evt_cloud_summit_2026',
        eventTitle: 'Cloud Computing & Serverless Architecture Workshop',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];
    setLocalCollection(STORAGE_KEYS.NOTIFICATIONS, sampleNotifications);
  }
}

export { STORAGE_KEYS };
