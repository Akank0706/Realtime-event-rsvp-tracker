/**
 * Event Management Service
 * Handles Create, Read, Update, Delete, Publish, and Cancel operations
 * with validation and real-time onSnapshot subscription.
 */

import type { EventCategory, EventData, EventStatus, UserProfile } from '../firebase/firestoreTypes';
import {
  getLocalCollection,
  setLocalCollection,
  STORAGE_KEYS,
  subscribeRealtime,
  seedInitialDataIfNeeded,
} from './dbStore';
import { isFirebaseConfigured, db } from '../firebase/config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

export interface CreateEventInput {
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  imageUrl?: string;
  status?: EventStatus;
  registrationDeadline?: string;
}

export function validateEventInput(input: CreateEventInput): void {
  if (!input.title || input.title.trim().length < 3) {
    throw new Error('Event title must be at least 3 characters long.');
  }
  if (!input.description || input.description.trim().length < 10) {
    throw new Error('Description must be at least 10 characters long.');
  }
  if (!input.location || input.location.trim().length < 3) {
    throw new Error('Venue location or virtual link is required.');
  }
  if (!input.date) {
    throw new Error('Event date is required.');
  }
  if (!input.startTime || !input.endTime) {
    throw new Error('Start and end times are required.');
  }
  if (input.startTime >= input.endTime) {
    throw new Error('Event end time must be after start time.');
  }
  if (!input.capacity || input.capacity < 1) {
    throw new Error('Capacity must be a positive integer (minimum 1).');
  }
}

export async function createEvent(
  input: CreateEventInput,
  organizer: UserProfile
): Promise<EventData> {
  if (organizer.role !== 'organizer') {
    throw new Error('Unauthorized: Only registered Organizers can create events.');
  }

  validateEventInput(input);
  seedInitialDataIfNeeded();

  const eventId = 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  const now = new Date().toISOString();

  const newEvent: EventData = {
    id: eventId,
    organizerId: organizer.uid,
    organizerName: organizer.name,
    organizerEmail: organizer.email,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    location: input.location.trim(),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    capacity: Number(input.capacity),
    goingCount: 0,
    maybeCount: 0,
    notGoingCount: 0,
    waitlistCount: 0,
    imageUrl: input.imageUrl || '',
    status: input.status || 'PUBLISHED',
    registrationDeadline: input.registrationDeadline || '',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'events', eventId), newEvent);
    } catch (e) {
      console.warn('Firebase setDoc failed, saving to local cloud store:', e);
    }
  }

  const events = getLocalCollection<EventData>(STORAGE_KEYS.EVENTS);
  events.unshift(newEvent);
  setLocalCollection(STORAGE_KEYS.EVENTS, events);

  return newEvent;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<CreateEventInput>,
  currentUser: UserProfile
): Promise<EventData> {
  seedInitialDataIfNeeded();
  const events = getLocalCollection<EventData>(STORAGE_KEYS.EVENTS);
  const index = events.findIndex((e) => e.id === eventId);

  if (index === -1) {
    throw new Error('Event not found.');
  }

  const existing = events[index];
  if (currentUser.role !== 'organizer' || existing.organizerId !== currentUser.uid) {
    throw new Error('Unauthorized: You can only edit events you organized.');
  }

  if (updates.capacity !== undefined && updates.capacity < existing.goingCount) {
    throw new Error(
      `Cannot lower capacity below current confirmed Going count (${existing.goingCount}).`
    );
  }

  const updated: EventData = {
    ...existing,
    ...updates,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    location: updates.location !== undefined ? updates.location.trim() : existing.location,
    capacity: updates.capacity !== undefined ? Number(updates.capacity) : existing.capacity,
    updatedAt: new Date().toISOString(),
  };

  // Adjust full status based on new capacity
  if (updated.goingCount >= updated.capacity) {
    updated.status = 'FULL';
  } else if (existing.status === 'FULL') {
    updated.status = 'PUBLISHED';
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'events', eventId), updated as any);
    } catch (e) {
      console.warn('Firebase updateDoc failed, local cloud updated:', e);
    }
  }

  events[index] = updated;
  setLocalCollection(STORAGE_KEYS.EVENTS, events);

  return updated;
}

export async function setEventStatus(
  eventId: string,
  newStatus: EventStatus,
  currentUser: UserProfile
): Promise<EventData> {
  seedInitialDataIfNeeded();
  const events = getLocalCollection<EventData>(STORAGE_KEYS.EVENTS);
  const target = events.find((e) => e.id === eventId);

  if (!target) throw new Error('Event not found.');
  if (currentUser.role !== 'organizer' || target.organizerId !== currentUser.uid) {
    throw new Error('Unauthorized: Only the event organizer can change status.');
  }

  return updateEvent(eventId, { status: newStatus } as any, currentUser);
}

export async function deleteEvent(eventId: string, currentUser: UserProfile): Promise<void> {
  seedInitialDataIfNeeded();
  const events = getLocalCollection<EventData>(STORAGE_KEYS.EVENTS);
  const target = events.find((e) => e.id === eventId);

  if (!target) throw new Error('Event not found.');
  if (currentUser.role !== 'organizer' || target.organizerId !== currentUser.uid) {
    throw new Error('Unauthorized: You can only delete your own events.');
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (e) {
      console.warn('Firebase deleteDoc failed:', e);
    }
  }

  const filtered = events.filter((e) => e.id !== eventId);
  setLocalCollection(STORAGE_KEYS.EVENTS, filtered);
}

export function getEventById(eventId: string): EventData | null {
  seedInitialDataIfNeeded();
  const events = getLocalCollection<EventData>(STORAGE_KEYS.EVENTS);
  return events.find((e) => e.id === eventId) || null;
}

export function subscribeEvents(
  callback: (events: EventData[]) => void
): () => void {
  seedInitialDataIfNeeded();

  // Initial call with current local state
  callback(getLocalCollection<EventData>(STORAGE_KEYS.EVENTS));

  // If Firebase Firestore is active, also listen to Firestore onSnapshot
  let firestoreUnsub: (() => void) | null = null;
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'events');
      firestoreUnsub = onSnapshot(colRef, (snapshot) => {
        const firestoreEvents: EventData[] = [];
        snapshot.forEach((docSnap) => {
          firestoreEvents.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        if (firestoreEvents.length > 0) {
          setLocalCollection(STORAGE_KEYS.EVENTS, firestoreEvents);
          callback(firestoreEvents);
        }
      });
    } catch (e) {
      console.warn('Firestore onSnapshot subscription failed, using local bus:', e);
    }
  }

  const localUnsub = subscribeRealtime(STORAGE_KEYS.EVENTS, (data) => {
    callback(data || []);
  });

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}
