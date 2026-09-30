import React, { useState, useEffect } from 'react';
import type { EventData, UserProfile } from '../firebase/firestoreTypes';
import { useLiveEvents } from '../hooks/useLiveEvent';
import { computeOrganizerAnalytics } from '../services/analyticsService';
import { setEventStatus, deleteEvent } from '../services/eventService';
import { QrCodeModal } from '../components/QrCodeModal';
import { AnnouncementModal } from '../components/AnnouncementModal';
import {
  Calendar,
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Clock,
  PlusCircle,
  Radio,
  BarChart2,
  Share2,
  Megaphone,
  Edit,
  Trash2,
  AlertCircle,
  Check,
  TrendingUp,
} from 'lucide-react';

interface OrganizerDashboardProps {
  currentUser: UserProfile;
  setActiveTab: (tab: string) => void;
  onSelectEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  currentUser,
  setActiveTab,
  onSelectEvent,
  onEditEvent,
}) => {
  const { events, loading } = useLiveEvents();
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventData | null>(null);
  const [selectedAnnouncementEvent, setSelectedAnnouncementEvent] = useState<EventData | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter events created by this organizer
  const myEvents = events.filter((e) => e.organizerId === currentUser.uid);
  const analytics = computeOrganizerAnalytics(currentUser.uid);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleToggleStatus = async (event: EventData) => {
    try {
      const nextStatus = event.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
      await setEventStatus(event.id, nextStatus, currentUser);
      showToast(`Event status updated to ${nextStatus}.`);
    } catch (err: any) {
      alert(err.message || 'Status change failed.');
    }
  };

  const handleDelete = async (eventId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        await deleteEvent(eventId, currentUser);
        showToast('Event deleted successfully.');
      } catch (err: any) {
        alert(err.message || 'Failed to delete event.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Organizer Live Dashboard</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Radio className="w-3 h-3 mr-1 text-emerald-600 animate-pulse" />
              Real-Time Active
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, <span className="font-semibold text-gray-800">{currentUser.name}</span>.
            Live counts update dynamically without page reloads.
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setActiveTab('analytics')}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center shadow-xs"
          >
            <BarChart2 className="w-4 h-4 mr-1.5 text-gray-500" />
            Full Analytics
          </button>
          <button
            onClick={() => setActiveTab('create-event')}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center shadow-xs"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Create Event
          </button>
        </div>
      </div>

      {successToast && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center">
          <Check className="w-4 h-4 mr-2 text-emerald-600" />
          {successToast}
        </div>
      )}

      {/* Real-time Metric Cards (Strictly calculated from database) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">My Events</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalEvents}</p>
          <span className="text-[11px] text-gray-400">{analytics.publishedEvents} published</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Total RSVPs</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalRsvps}</p>
          <span className="text-[11px] text-indigo-600 font-medium">Responses received</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Going</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{analytics.goingCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">{analytics.goingPercentage}% confirmed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Maybe</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{analytics.maybeCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">{analytics.maybePercentage}% tentative</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Waitlisted</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{analytics.waitlistCount}</p>
          <span className="text-[11px] text-purple-700 font-medium">Queue count</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Capacity Fill</span>
            <TrendingUp className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.capacityUtilization}%</p>
          <span className="text-[11px] text-gray-400">Total capacity {analytics.totalCapacity}</span>
        </div>
      </div>

      {/* Events Table / Roster */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">Events Managed by You</h2>
            <p className="text-xs text-gray-500">Live synchronization with Firestore real-time listeners</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Listening for real-time changes</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading cloud events...</div>
        ) : myEvents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No events created yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first cloud event. You can track real-time RSVPs and manage capacity.
            </p>
            <button
              onClick={() => setActiveTab('create-event')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Create First Event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3">Date & Venue</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Capacity & Available</th>
                  <th className="px-6 py-3">Going / Maybe / Not</th>
                  <th className="px-6 py-3">Waitlist</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {myEvents.map((evt) => {
                  const available = Math.max(0, evt.capacity - evt.goingCount);
                  const isFull = evt.goingCount >= evt.capacity;

                  return (
                    <tr key={evt.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div
                          onClick={() => onSelectEvent(evt.id)}
                          className="font-bold text-gray-900 hover:text-blue-600 cursor-pointer"
                        >
                          {evt.title}
                        </div>
                        <span className="text-[11px] text-gray-400">{evt.category}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{evt.date}</div>
                        <div className="text-gray-500 truncate max-w-xs">{evt.location}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                            evt.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : evt.status === 'FULL'
                              ? 'bg-amber-100 text-amber-800'
                              : evt.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {evt.goingCount} / {evt.capacity}
                        </div>
                        <span className={`text-[11px] ${available === 0 ? 'text-rose-600 font-bold' : 'text-gray-500'}`}>
                          {available === 0 ? 'Full (0 available)' : `${available} seats available`}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 font-medium">
                          <span className="text-emerald-700" title="Going">
                            ✓ {evt.goingCount}
                          </span>
                          <span className="text-amber-700" title="Maybe">
                            ? {evt.maybeCount}
                          </span>
                          <span className="text-gray-500" title="Not Going">
                            ✗ {evt.notGoingCount}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {evt.waitlistCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">
                            {evt.waitlistCount} waiting
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">0</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedAnnouncementEvent(evt)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                            title="Broadcast Announcement"
                          >
                            <Megaphone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedQrEvent(evt)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Show QR Code"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditEvent(evt.id)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit Event"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(evt.id, evt.title)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QrCodeModal event={selectedQrEvent} onClose={() => setSelectedQrEvent(null)} />

      {/* Announcement Modal */}
      <AnnouncementModal
        event={selectedAnnouncementEvent}
        organizer={currentUser}
        onClose={() => setSelectedAnnouncementEvent(null)}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
};
