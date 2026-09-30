import { useState, useEffect } from 'react';
import type { EventData, RsvpRecord, WaitlistRecord } from '../firebase/firestoreTypes';
import { subscribeEvents, getEventById } from '../services/eventService';
import {
  subscribeEventRsvps,
  subscribeEventWaitlist,
  getUserRsvpForEvent,
  getUserWaitlistForEvent,
} from '../services/rsvpService';

export function useLiveEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = subscribeEvents((latest) => {
      setEvents([...latest]);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { events, loading };
}

export function useLiveEventDetails(eventId: string, currentUserId?: string) {
  const [event, setEvent] = useState<EventData | null>(() => getEventById(eventId));
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRecord[]>([]);
  const [userRsvp, setUserRsvp] = useState<RsvpRecord | null>(null);
  const [userWaitlist, setUserWaitlist] = useState<WaitlistRecord | null>(null);

  useEffect(() => {
    if (!eventId) return;

    // Listen to events list for real-time count updates
    const unsubEvents = subscribeEvents((all) => {
      const match = all.find((e) => e.id === eventId);
      if (match) setEvent(match);
    });

    const unsubRsvps = subscribeEventRsvps(eventId, (latestRsvps) => {
      setRsvps(latestRsvps);
      if (currentUserId) {
        const myRsvp = latestRsvps.find((r) => r.userId === currentUserId);
        setUserRsvp(myRsvp || null);
      }
    });

    const unsubWaitlist = subscribeEventWaitlist(eventId, (latestWaitlist) => {
      setWaitlist(latestWaitlist);
      if (currentUserId) {
        const myWait = latestWaitlist.find((w) => w.userId === currentUserId);
        setUserWaitlist(myWait || null);
      }
    });

    return () => {
      unsubEvents();
      unsubRsvps();
      unsubWaitlist();
    };
  }, [eventId, currentUserId]);

  return { event, rsvps, waitlist, userRsvp, userWaitlist };
}
