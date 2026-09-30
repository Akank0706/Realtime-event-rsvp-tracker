import React, { useState, useEffect } from 'react';
import type { EventData, RsvpRecord, RsvpStatus, UserProfile, WaitlistRecord } from '../firebase/firestoreTypes';
import { useLiveEvents } from '../hooks/useLiveEvent';
import {
  subscribeUserRsvps,
  submitRsvpAtomic,
  cancelRsvp,
} from '../services/rsvpService';
import { getLocalCollection, STORAGE_KEYS, subscribeRealtime } from '../services/dbStore';
import { EventCard } from '../components/EventCard';
import { QrCodeModal } from '../components/QrCodeModal';
import { CheckCircle2, HelpCircle, XCircle, Clock, Calendar, ArrowRight } from 'lucide-react';

interface MyRsvpsProps {
  currentUser: UserProfile;
  onSelectEvent: (eventId: string) => void;
  onBrowse: () => void;
}

export const MyRsvps: React.FC<MyRsvpsProps> = ({
  currentUser,
  onSelectEvent,
  onBrowse,
}) => {
  const { events } = useLiveEvents();
  const [userRsvps, setUserRsvps] = useState<RsvpRecord[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | RsvpStatus | 'WAITLIST'>('ALL');
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventData | null>(null);

  useEffect(() => {
    const unsubRsvps = subscribeUserRsvps(currentUser.uid, (list) => {
      setUserRsvps(list);
    });

    const updateWaitlist = () => {
      const allWl = getLocalCollection<WaitlistRecord>(STORAGE_KEYS.WAITLIST);
      setWaitlist(allWl.filter((w) => w.userId === currentUser.uid && w.status === 'WAITING'));
    };
    updateWaitlist();
    const unsubWl = subscribeRealtime(STORAGE_KEYS.WAITLIST, updateWaitlist);

    return () => {
      unsubRsvps();
      unsubWl();
    };
  }, [currentUser.uid]);

  const rsvpMap = new Map<string, RsvpStatus>();
  userRsvps.forEach((r) => rsvpMap.set(r.eventId, r.status));

  const waitlistMap = new Map<string, number>();
  waitlist.forEach((w) => waitlistMap.set(w.eventId, w.position));

  // Events that have an RSVP or waitlist entry
  const myEvents = events.filter(
    (e) => rsvpMap.has(e.id) || waitlistMap.has(e.id)
  );

  const filteredEvents = myEvents.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'WAITLIST') return waitlistMap.has(e.id);
    return rsvpMap.get(e.id) === filter;
  });

  const handleQuickRsvp = async (eventId: string, status: RsvpStatus) => {
    try {
      await submitRsvpAtomic({
        eventId,
        user: currentUser,
        targetStatus: status,
      });
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="pb-6 border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My RSVP Portfolio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track events you have registered for, adjust attendance responses, and track waitlist spots.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs font-medium">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-2 rounded-lg border transition-colors ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          All My Responses ({myEvents.length})
        </button>

        <button
          onClick={() => setFilter('GOING')}
          className={`px-3.5 py-2 rounded-lg border transition-colors flex items-center ${
            filter === 'GOING'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-emerald-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Going ({userRsvps.filter((r) => r.status === 'GOING').length})
        </button>

        <button
          onClick={() => setFilter('MAYBE')}
          className={`px-3.5 py-2 rounded-lg border transition-colors flex items-center ${
            filter === 'MAYBE'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-amber-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 mr-1" />
          Maybe ({userRsvps.filter((r) => r.status === 'MAYBE').length})
        </button>

        <button
          onClick={() => setFilter('NOT_GOING')}
          className={`px-3.5 py-2 rounded-lg border transition-colors flex items-center ${
            filter === 'NOT_GOING'
              ? 'bg-gray-700 text-white border-gray-700'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Not Going ({userRsvps.filter((r) => r.status === 'NOT_GOING').length})
        </button>

        <button
          onClick={() => setFilter('WAITLIST')}
          className={`px-3.5 py-2 rounded-lg border transition-colors flex items-center ${
            filter === 'WAITLIST'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-purple-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 mr-1" />
          Waitlisted ({waitlist.length})
        </button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">
            {filter === 'ALL' ? 'No event responses found' : `No ${filter.toLowerCase()} events`}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Discover upcoming sessions and reserve your attendance status.
          </p>
          <button
            onClick={onBrowse}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center"
          >
            Browse Public Events <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="relative">
              <EventCard
                event={evt}
                userRsvpStatus={rsvpMap.get(evt.id)}
                isWaitlisted={waitlistMap.has(evt.id)}
                onSelectEvent={onSelectEvent}
                onShowQr={(e) => setSelectedQrEvent(e)}
                onQuickRsvp={handleQuickRsvp}
              />
              {waitlistMap.has(evt.id) && (
                <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  Waitlist Position #{waitlistMap.get(evt.id)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <QrCodeModal event={selectedQrEvent} onClose={() => setSelectedQrEvent(null)} />
    </div>
  );
};
