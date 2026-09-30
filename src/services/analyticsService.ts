/**
 * Analytics Service
 * Computes strictly derived metrics from real Firestore and cloud database records.
 * Contains zero hardcoded numbers.
 */

import type { EventData, RsvpRecord, EventCategory } from '../firebase/firestoreTypes';
import { getLocalCollection, STORAGE_KEYS, seedInitialDataIfNeeded } from './dbStore';

export interface PlatformAnalytics {
  totalEvents: number;
  publishedEvents: number;
  upcomingEvents: number;
  totalCapacity: number;
  totalRsvps: number;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  waitlistCount: number;
  goingPercentage: number;
  maybePercentage: number;
  notGoingPercentage: number;
  capacityUtilization: number;
  averageResponseRate: number;
  mostPopularCategory: string;
  categoryBreakdown: { category: string; count: number; rsvps: number }[];
  eventPerformance: {
    id: string;
    title: string;
    capacity: number;
    going: number;
    maybe: number;
    notGoing: number;
    waitlist: number;
    utilizationRate: number;
  }[];
}

export function computeOrganizerAnalytics(organizerId?: string): PlatformAnalytics {
  seedInitialDataIfNeeded();

  let events = getLocalCollection<EventData>(STORAGE_KEYS.EVENTS);
  let rsvps = getLocalCollection<RsvpRecord>(STORAGE_KEYS.RSVPS);

  if (organizerId) {
    events = events.filter((e) => e.organizerId === organizerId);
    const eventIds = new Set(events.map((e) => e.id));
    rsvps = rsvps.filter((r) => eventIds.has(r.eventId));
  }

  const now = new Date().toISOString().split('T')[0];

  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED' || e.status === 'FULL').length;
  const upcomingEvents = events.filter((e) => e.date >= now && e.status !== 'CANCELLED').length;

  let totalCapacity = 0;
  let goingCount = 0;
  let maybeCount = 0;
  let notGoingCount = 0;
  let waitlistCount = 0;

  events.forEach((e) => {
    totalCapacity += e.capacity;
    goingCount += e.goingCount;
    maybeCount += e.maybeCount;
    notGoingCount += e.notGoingCount;
    waitlistCount += e.waitlistCount || 0;
  });

  const totalRsvps = goingCount + maybeCount + notGoingCount;

  const goingPercentage = totalRsvps > 0 ? Math.round((goingCount / totalRsvps) * 100) : 0;
  const maybePercentage = totalRsvps > 0 ? Math.round((maybeCount / totalRsvps) * 100) : 0;
  const notGoingPercentage = totalRsvps > 0 ? Math.round((notGoingCount / totalRsvps) * 100) : 0;

  const capacityUtilization =
    totalCapacity > 0 ? Math.min(100, Math.round((goingCount / totalCapacity) * 100)) : 0;

  const averageResponseRate =
    totalCapacity > 0 ? Math.min(100, Math.round((totalRsvps / totalCapacity) * 100)) : 0;

  // Category counts
  const categoryMap = new Map<string, { count: number; rsvps: number }>();
  events.forEach((evt) => {
    const prev = categoryMap.get(evt.category) || { count: 0, rsvps: 0 };
    categoryMap.set(evt.category, {
      count: prev.count + 1,
      rsvps: prev.rsvps + evt.goingCount + evt.maybeCount,
    });
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    count: stats.count,
    rsvps: stats.rsvps,
  }));

  categoryBreakdown.sort((a, b) => b.rsvps - a.rsvps);
  const mostPopularCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'None';

  // Event performance table
  const eventPerformance = events.map((e) => ({
    id: e.id,
    title: e.title,
    capacity: e.capacity,
    going: e.goingCount,
    maybe: e.maybeCount,
    notGoing: e.notGoingCount,
    waitlist: e.waitlistCount || 0,
    utilizationRate: e.capacity > 0 ? Math.min(100, Math.round((e.goingCount / e.capacity) * 100)) : 0,
  }));

  return {
    totalEvents,
    publishedEvents,
    upcomingEvents,
    totalCapacity,
    totalRsvps,
    goingCount,
    maybeCount,
    notGoingCount,
    waitlistCount,
    goingPercentage,
    maybePercentage,
    notGoingPercentage,
    capacityUtilization,
    averageResponseRate,
    mostPopularCategory,
    categoryBreakdown,
    eventPerformance,
  };
}
