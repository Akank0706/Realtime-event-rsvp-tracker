import React, { useState, useEffect } from 'react';
import type { EventData, RsvpRecord, RsvpStatus, UserProfile, WaitlistRecord } from '../firebase/firestoreTypes';
import { useLiveEvents } from '../hooks/useLiveEvent';
import { subscribeUserRsvps, submitRsvpAtomic } from '../services/rsvpService';
import { getLocalCollection, STORAGE_KEYS, subscribeRealtime } from '../services/dbStore';
import { EventCard } from '../components/EventCard';
import { QrCodeModal } from '../components/QrCodeModal';
import {
  Compass,
  CheckCircle2,
  HelpCircle,
  Clock,
  Radio,
  Calendar,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface AttendeeDashboardProps {
  currentUser: UserProfile;
  setActiveTab: (tab: string) => void;
  onSelectEvent: (eventId: string) => void;
}

export const AttendeeDashboard: React.FC<AttendeeDashboardProps> = ({
  currentUser,
  setActiveTab,
  onSelectEvent,
}) => {
  const { events, loading } = useLiveEvents();
  const [userRsvps, setUserRsvps] = useState<RsvpRecord[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistRecord[]>([]);
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventData | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubRsvps = subscribeUserRsvps(currentUser.uid, (list) => {
      setUserRsvps(list);
    });

    const updateWaitlist = () => {
      const allWaitlist = getLocalCollection<WaitlistRecord>(STORAGE_KEYS.WAITLIST);
      const mine = allWaitlist.filter((w) => w.userId === currentUser.uid && w.status === 'WAITING');
      setWaitlistEntries(mine);
    };

    updateWaitlist();
    const unsubWaitlist = subscribeRealtime(STORAGE_KEYS.WAITLIST, () => {
      updateWaitlist();
    });

    return () => {
      unsubRsvps();
      unsubWaitlist();
    };
  }, [currentUser.uid]);

  const rsvpMap = new Map<string, RsvpStatus>();
  userRsvps.forEach((r) => rsvpMap.set(r.eventId, r.status));

  const waitlistEventIds = new Set(waitlistEntries.map((w) => w.eventId));

  const goingEvents = events.filter((e) => rsvpMap.get(e.id) === 'GOING');
  const maybeEvents = events.filter((e) => rsvpMap.get(e.id) === 'MAYBE');
  const waitlistedEvents = events.filter((e) => waitlistEventIds.has(e.id));
  const upcomingEvents = events.filter(
    (e) => e.status !== 'CANCELLED' && e.status !== 'DRAFT'
  );

  const handleQuickRsvp = async (eventId: string, status: RsvpStatus) => {
    try {
      const res = await submitRsvpAtomic({
        eventId,
        user: currentUser,
        targetStatus: status,
      });
      setActionMessage(res.message);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message || 'RSVP failed.');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Attendee Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Attendee Portal</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Radio className="w-3 h-3 mr-1 text-emerald-600 animate-pulse" />
              Live Connected
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, <span className="font-semibold text-gray-800">{currentUser.name}</span>.
            Discover events, manage your attendance responses, and monitor waitlist status.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('browse')}
          className="mt-4 sm:mt-0 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center shadow-xs self-start sm:self-auto"
        >
          <Compass className="w-4 h-4 mr-1.5" />
          Browse All Events
        </button>
      </div>

      {actionMessage && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
          {actionMessage}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">My Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{goingEvents.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Events Going</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Interested</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{maybeEvents.length}</p>
          <span className="text-[11px] text-amber-700 font-medium">Events Maybe</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Waitlisted</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{waitlistEntries.length}</p>
          <span className="text-[11px] text-purple-700 font-medium">Queued for seat</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Available Events</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
          <span className="text-[11px] text-gray-400">Open for RSVP</span>
        </div>
      </div>

      {/* Confirmed Going Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            Events You Are Going To ({goingEvents.length})
          </h2>
        </div>

        {goingEvents.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center text-xs text-gray-500">
            You haven't marked Going for any events yet. Check out available sessions below!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goingEvents.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                userRsvpStatus={rsvpMap.get(evt.id)}
                isWaitlisted={waitlistEventIds.has(evt.id)}
                onSelectEvent={onSelectEvent}
                onShowQr={(e) => setSelectedQrEvent(e)}
                onQuickRsvp={handleQuickRsvp}
              />
            ))}
          </div>
        )}
      </div>

      {/* Waitlisted Events Section */}
      {waitlistedEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-900 flex items-center mb-4">
            <Clock className="w-4 h-4 mr-2 text-purple-600" />
            Waitlisted Events ({waitlistedEvents.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {waitlistedEvents.map((evt) => {
              const wlItem = waitlistEntries.find((w) => w.eventId === evt.id);
              return (
                <div key={evt.id} className="relative">
                  <EventCard
                    event={evt}
                    userRsvpStatus={rsvpMap.get(evt.id)}
                    isWaitlisted={true}
                    onSelectEvent={onSelectEvent}
                    onShowQr={(e) => setSelectedQrEvent(e)}
                  />
                  {wlItem && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Queue Position #{wlItem.position}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Discover Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center">
            <Compass className="w-4 h-4 mr-2 text-blue-600" />
            Featured & Upcoming Events
          </h2>
          <button
            onClick={() => setActiveTab('browse')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
          >
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-xs text-gray-500">
            No upcoming events found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingEvents.slice(0, 3).map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                userRsvpStatus={rsvpMap.get(evt.id)}
                isWaitlisted={waitlistEventIds.has(evt.id)}
                onSelectEvent={onSelectEvent}
                onShowQr={(e) => setSelectedQrEvent(e)}
                onQuickRsvp={handleQuickRsvp}
              />
            ))}
          </div>
        )}
      </div>

      <QrCodeModal event={selectedQrEvent} onClose={() => setSelectedQrEvent(null)} />
    </div>
  );
};
