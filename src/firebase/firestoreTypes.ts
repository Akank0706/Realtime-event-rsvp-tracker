export type UserRole = 'organizer' | 'attendee';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  createdAt: string;
}

export type EventCategory =
  | 'Workshop'
  | 'Seminar'
  | 'Conference'
  | 'College Event'
  | 'Meetup'
  | 'Webinar'
  | 'Training'
  | 'Social'
  | 'Other';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'FULL' | 'COMPLETED' | 'CANCELLED';

export interface EventData {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  capacity: number;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  waitlistCount: number;
  imageUrl?: string;
  status: EventStatus;
  registrationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export type RsvpStatus = 'GOING' | 'MAYBE' | 'NOT_GOING';

export interface RsvpRecord {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: RsvpStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistRecord {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: string;
  position: number;
  status: 'WAITING' | 'PROMOTED' | 'CANCELLED';
}

export interface AnnouncementRecord {
  id: string;
  eventId: string;
  organizerId: string;
  organizerName: string;
  title: string;
  message: string;
  createdAt: string;
}

export type NotificationType =
  | 'RSVP_CONFIRMATION'
  | 'RSVP_CHANGED'
  | 'EVENT_ANNOUNCEMENT'
  | 'WAITLIST_PROMOTED'
  | 'EVENT_CANCELLED'
  | 'EVENT_REMINDER';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
  eventTitle?: string;
  read: boolean;
  createdAt: string;
}
