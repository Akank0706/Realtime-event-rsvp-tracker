import React, { useState, useMemo } from 'react';
import type { EventCategory, EventData, RsvpRecord, RsvpStatus, UserProfile } from '../firebase/firestoreTypes';
import { useLiveEvents } from '../hooks/useLiveEvent';
import { subscribeUserRsvps, submitRsvpAtomic } from '../services/rsvpService';
import { EventCard } from '../components/EventCard';
import { QrCodeModal } from '../components/QrCodeModal';
import { Search, Filter, Calendar, Compass, Radio } from 'lucide-react';

interface BrowseEventsProps {
  currentUser: UserProfile;
  onSelectEvent: (eventId: string) => void;
}

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Workshop',
  'Seminar',
  'Conference',
  'College Event',
  'Meetup',
  'Webinar',
  'Training',
  'Social',
  'Other',
];

export const BrowseEvents: React.FC<BrowseEventsProps> = ({ currentUser, onSelectEvent }) => {
  const { events, loading } = useLiveEvents();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventData | null>(null);
  const [userRsvps, setUserRsvps] = useState<RsvpRecord[]>([]);

  React.useEffect(() => {
    const unsub = subscribeUserRsvps(currentUser.uid, (list) => {
      setUserRsvps(list);
    });
    return unsub;
  }, [currentUser.uid]);

  const rsvpMap = useMemo(() => {
    const map = new Map<string, RsvpStatus>();
    userRsvps.forEach((r) => map.set(r.eventId, r.status));
    return map;
  }, [userRsvps]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Exclude cancelled and drafts from public discovery
      if (evt.status === 'CANCELLED' || evt.status === 'DRAFT') return false;

      // Category filter
      if (selectedCategory !== 'All' && evt.category !== selectedCategory) return false;

      // Date filter
      if (selectedDate && evt.date !== selectedDate) return false;

      // Keyword search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(query);
        const matchDesc = evt.description.toLowerCase().includes(query);
        const matchLoc = evt.location.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }

      return true;
    });
  }, [events, selectedCategory, selectedDate, searchTerm]);

  const handleQuickRsvp = async (eventId: string, status: RsvpStatus) => {
    try {
      await submitRsvpAtomic({
        eventId,
        user: currentUser,
        targetStatus: status,
      });
    } catch (err: any) {
      alert(err.message || 'RSVP failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title */}
      <div className="pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-900">Discover Cloud Events</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
            <Radio className="w-3 h-3 mr-1 text-emerald-600 animate-pulse" />
            Live RSVP Sync
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Browse upcoming sessions, reserve your seat with atomic capacity locking, or join waitlists.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-8 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by topic, keyword, or venue..."
              className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {(searchTerm || selectedCategory !== 'All' || selectedDate) && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>
              Showing {filteredEvents.length} filtered event{filteredEvents.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedDate('');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500">Loading live events from Firestore...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No matching events found</h3>
          <p className="text-xs text-gray-500 mt-1">Try relaxing your search terms or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              userRsvpStatus={rsvpMap.get(evt.id)}
              onSelectEvent={onSelectEvent}
              onShowQr={(e) => setSelectedQrEvent(e)}
              onQuickRsvp={handleQuickRsvp}
            />
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <QrCodeModal event={selectedQrEvent} onClose={() => setSelectedQrEvent(null)} />
    </div>
  );
};
