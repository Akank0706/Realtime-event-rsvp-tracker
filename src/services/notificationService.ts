/**
 * Notification & Organizer Announcement Service
 * Delivers in-app notifications for RSVP updates, capacity changes, waitlist promotions,
 * and broadcast announcements to event attendees.
 */

import type {
  AnnouncementRecord,
  NotificationRecord,
  NotificationType,
  RsvpRecord,
  UserProfile,
} from '../firebase/firestoreTypes';
import {
  getLocalCollection,
  setLocalCollection,
  STORAGE_KEYS,
  subscribeRealtime,
  seedInitialDataIfNeeded,
} from './dbStore';
import { getEventById } from './eventService';

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
  eventTitle?: string;
}): Promise<NotificationRecord> {
  seedInitialDataIfNeeded();

  const notifications = getLocalCollection<NotificationRecord>(STORAGE_KEYS.NOTIFICATIONS);
  const newNotif: NotificationRecord = {
    id: 'notif_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    eventId: params.eventId,
    eventTitle: params.eventTitle,
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(newNotif);
  setLocalCollection(STORAGE_KEYS.NOTIFICATIONS, notifications);
  return newNotif;
}

export async function sendOrganizerAnnouncement(params: {
  eventId: string;
  title: string;
  message: string;
  organizer: UserProfile;
}): Promise<AnnouncementRecord> {
  const { eventId, title, message, organizer } = params;

  if (organizer.role !== 'organizer') {
    throw new Error('Unauthorized: Only event organizers can send announcements.');
  }

  const event = getEventById(eventId);
  if (!event) throw new Error('Event not found.');
  if (event.organizerId !== organizer.uid) {
    throw new Error('Unauthorized: You can only broadcast announcements to your own events.');
  }

  if (!title.trim() || !message.trim()) {
    throw new Error('Announcement title and message are required.');
  }

  seedInitialDataIfNeeded();

  // Create Announcement Record
  const announcements = getLocalCollection<AnnouncementRecord>(STORAGE_KEYS.ANNOUNCEMENTS);
  const announcementId = 'anc_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  const newAnnouncement: AnnouncementRecord = {
    id: announcementId,
    eventId,
    organizerId: organizer.uid,
    organizerName: organizer.name,
    title: title.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  announcements.unshift(newAnnouncement);
  setLocalCollection(STORAGE_KEYS.ANNOUNCEMENTS, announcements);

  // Deliver Notification to all attendees who RSVP'd to this event
  const allRsvps = getLocalCollection<RsvpRecord>(STORAGE_KEYS.RSVPS);
  const attendeeRsvps = allRsvps.filter(
    (r) => r.eventId === eventId && (r.status === 'GOING' || r.status === 'MAYBE')
  );

  const notifications = getLocalCollection<NotificationRecord>(STORAGE_KEYS.NOTIFICATIONS);
  const now = new Date().toISOString();

  attendeeRsvps.forEach((rsvp) => {
    notifications.unshift({
      id: 'notif_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      userId: rsvp.userId,
      type: 'EVENT_ANNOUNCEMENT',
      title: `Announcement: ${event.title}`,
      message: `${title}: ${message}`,
      eventId: event.id,
      eventTitle: event.title,
      read: false,
      createdAt: now,
    });
  });

  setLocalCollection(STORAGE_KEYS.NOTIFICATIONS, notifications);

  return newAnnouncement;
}

export function subscribeNotifications(
  userId: string,
  callback: (notifications: NotificationRecord[]) => void
): () => void {
  seedInitialDataIfNeeded();
  const getFiltered = () => {
    const all = getLocalCollection<NotificationRecord>(STORAGE_KEYS.NOTIFICATIONS);
    return all.filter((n) => n.userId === userId);
  };

  callback(getFiltered());
  return subscribeRealtime(STORAGE_KEYS.NOTIFICATIONS, () => {
    callback(getFiltered());
  });
}

export function subscribeEventAnnouncements(
  eventId: string,
  callback: (announcements: AnnouncementRecord[]) => void
): () => void {
  seedInitialDataIfNeeded();
  const getFiltered = () => {
    const all = getLocalCollection<AnnouncementRecord>(STORAGE_KEYS.ANNOUNCEMENTS);
    return all.filter((a) => a.eventId === eventId);
  };

  callback(getFiltered());
  return subscribeRealtime(STORAGE_KEYS.ANNOUNCEMENTS, () => {
    callback(getFiltered());
  });
}

export function markNotificationRead(notificationId: string): void {
  seedInitialDataIfNeeded();
  const notifications = getLocalCollection<NotificationRecord>(STORAGE_KEYS.NOTIFICATIONS);
  const target = notifications.find((n) => n.id === notificationId);
  if (target) {
    target.read = true;
    setLocalCollection(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }
}

export function markAllNotificationsRead(userId: string): void {
  seedInitialDataIfNeeded();
  const notifications = getLocalCollection<NotificationRecord>(STORAGE_KEYS.NOTIFICATIONS);
  let changed = false;
  notifications.forEach((n) => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed) {
    setLocalCollection(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }
}
