import React, { useState, useEffect } from 'react';
import type { EventData, RsvpStatus, UserProfile } from '../firebase/firestoreTypes';
import { useLiveEventDetails } from '../hooks/useLiveEvent';
import {
  submitRsvpAtomic,
  cancelRsvp,
  joinWaitlist,
} from '../services/rsvpService';
import { setEventStatus, deleteEvent } from '../services/eventService';
import { subscribeEventAnnouncements } from '../services/notificationService';
import { QrCodeModal } from '../components/QrCodeModal';
import { AnnouncementModal } from '../components/AnnouncementModal';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Radio,
  ArrowLeft,
  Share2,
  Megaphone,
  AlertCircle,
  Check,
  Trash2,
  Edit,
  UserCheck,
  ListOrdered,
} from 'lucide-react';

interface EventDetailsProps {
  eventId: string;
  currentUser: UserProfile;
  onBack: () => void;
  onEdit: (eventId: string) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  eventId,
  currentUser,
  onBack,
  onEdit,
}) => {
  const { event, rsvps, waitlist, userRsvp, userWaitlist } = useLiveEventDetails(
    eventId,
    currentUser.uid
  );

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const unsub = subscribeEventAnnouncements(eventId, (list) => {
      setAnnouncements(list);
    });
    return unsub;
  }, [eventId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-sm">Event not found or has been removed.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const isOrganizer = currentUser.role === 'organizer' && event.organizerId === currentUser.uid;
  const isFull = event.goingCount >= event.capacity;
  const availableSeats = Math.max(0, event.capacity - event.goingCount);
  const fillPercent = Math.min(100, Math.round((event.goingCount / event.capacity) * 100));

  const handleRsvp = async (status: RsvpStatus) => {
    setLoadingAction(true);
    setErrorMessage(null);
    try {
      const res = await submitRsvpAtomic({
        eventId: event.id,
        user: currentUser,
        targetStatus: status,
      });
      showToast(res.message);
    } catch (err: any) {
      showError(err.message || 'Failed to submit RSVP.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!window.confirm('Are you sure you want to cancel your RSVP?')) return;
    setLoadingAction(true);
    try {
      const res = await cancelRsvp(event.id, currentUser);
      showToast(res.message);
    } catch (err: any) {
      showError(err.message || 'Failed to cancel RSVP.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setLoadingAction(true);
    try {
      const entry = await joinWaitlist(event.id, currentUser);
      showToast(`Successfully added to waitlist! You are #${entry.position} in line.`);
    } catch (err: any) {
      showError(err.message || 'Failed to join waitlist.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStatusChange = async (status: any) => {
    try {
      await setEventStatus(event.id, status, currentUser);
      showToast(`Event status updated to ${status}.`);
    } catch (err: any) {
      showError(err.message || 'Failed to update event status.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Permanently delete "${event.title}"?`)) {
      try {
        await deleteEvent(event.id, currentUser);
        onBack();
      } catch (err: any) {
        showError(err.message || 'Failed to delete event.');
      }
    }
  };

  const goingRsvps = rsvps.filter((r) => r.status === 'GOING');
  const maybeRsvps = rsvps.filter((r) => r.status === 'MAYBE');
  const notGoingRsvps = rsvps.filter((r) => r.status === 'NOT_GOING');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Events
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowQr(true)}
            className="inline-flex items-center text-xs font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Share / QR Code
          </button>

          {isOrganizer && (
            <>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="inline-flex items-center text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100"
              >
                <Megaphone className="w-3.5 h-3.5 mr-1.5" />
                Broadcast
              </button>
              <button
                onClick={() => onEdit(event.id)}
                className="inline-flex items-center text-xs font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center">
          <Check className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          {toastMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Main Grid: Details on Left, RSVP Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Specs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {event.category}
              </span>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <Radio className="w-3 h-3 mr-1 text-emerald-600 animate-pulse" />
                  Live Sync
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    event.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : event.status === 'FULL'
                      ? 'bg-amber-100 text-amber-800'
                      : event.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {event.status}
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{event.title}</h1>
            <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-line leading-relaxed mb-6">
              {event.description}
            </p>

            {/* Quick Metadata Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-xs">
              <div className="flex items-start">
                <Calendar className="w-4 h-4 mr-2.5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[11px]">Event Date</span>
                  <span className="font-semibold text-gray-800">{event.date}</span>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-4 h-4 mr-2.5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[11px]">Timing</span>
                  <span className="font-semibold text-gray-800">
                    {event.startTime} - {event.endTime}
                  </span>
                </div>
              </div>

              <div className="flex items-start sm:col-span-2">
                <MapPin className="w-4 h-4 mr-2.5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[11px]">Venue & Coordinates</span>
                  <span className="font-semibold text-gray-800">{event.location}</span>
                </div>
              </div>

              <div className="flex items-start sm:col-span-2">
                <ShieldCheck className="w-4 h-4 mr-2.5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[11px]">Verified Organizer</span>
                  <span className="font-semibold text-gray-800">
                    {event.organizerName} ({event.organizerEmail})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Announcements Board */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Megaphone className="w-4 h-4 mr-2 text-purple-600" />
              Event Announcements ({announcements.length})
            </h3>

            {announcements.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No announcements broadcast yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((anc) => (
                  <div key={anc.id} className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-purple-900">{anc.title}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(anc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{anc.message}</p>
                    <span className="text-[10px] text-purple-600 font-medium mt-1 block">
                      Posted by {anc.organizerName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-Time Live Attendee List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-emerald-600" />
                Live RSVP Responses ({rsvps.length})
              </h3>
              <span className="text-xs text-gray-400">Updated in real-time</span>
            </div>

            {rsvps.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No responses recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                {rsvps.map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-gray-800">{r.userName}</span>
                      <span className="text-[11px] text-gray-400 ml-2">({r.userEmail})</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        r.status === 'GOING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'MAYBE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Waitlist Queue */}
            {waitlist.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-bold text-purple-900 mb-2 flex items-center">
                  <ListOrdered className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                  FIFO Waitlist Queue ({waitlist.length} in queue)
                </h4>
                <div className="divide-y divide-purple-50">
                  {waitlist.map((wl) => (
                    <div key={wl.id} className="py-1.5 flex items-center justify-between text-xs text-gray-700">
                      <span>
                        <span className="font-bold text-purple-700 mr-2">#{wl.position}</span>
                        {wl.userName}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Joined {new Date(wl.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Capacity & Interactive RSVP Engine */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>Capacity & Live Status</span>
              <span className="text-xs font-normal text-emerald-600 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Live onSnapshot
              </span>
            </h3>

            {/* Large Live Counter Display */}
            <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
              <div className="text-3xl font-extrabold text-gray-900 transition-all">
                {event.goingCount} <span className="text-sm font-medium text-gray-400">/ {event.capacity}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">Confirmed Going Attendees</p>
              <div className="mt-2 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {availableSeats} seat{availableSeats === 1 ? '' : 's'} available
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Capacity Utilization</span>
                <span className="font-bold">{fillPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 transition-all duration-500 ${
                    fillPercent >= 100
                      ? 'bg-rose-500'
                      : fillPercent > 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>

            {/* Stat Counters Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-6">
              <div className="p-2 rounded bg-emerald-50 border border-emerald-100">
                <span className="block font-bold text-emerald-700 text-sm">{event.goingCount}</span>
                <span className="text-[10px] text-emerald-800 font-medium">Going</span>
              </div>
              <div className="p-2 rounded bg-amber-50 border border-amber-100">
                <span className="block font-bold text-amber-700 text-sm">{event.maybeCount}</span>
                <span className="text-[10px] text-amber-800 font-medium">Maybe</span>
              </div>
              <div className="p-2 rounded bg-gray-50 border border-gray-200">
                <span className="block font-bold text-gray-700 text-sm">{event.notGoingCount}</span>
                <span className="text-[10px] text-gray-600 font-medium">Not Going</span>
              </div>
            </div>

            {/* Attendee RSVP Action Panel */}
            {event.status === 'CANCELLED' ? (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium text-center">
                This event has been cancelled by the organizer. RSVPs are closed.
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-4">
                <div className="mb-3">
                  <span className="text-xs font-bold text-gray-800 block">Your Current Response:</span>
                  {userRsvp ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mt-1 ${
                        userRsvp.status === 'GOING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : userRsvp.status === 'MAYBE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {userRsvp.status === 'GOING' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                      {userRsvp.status === 'MAYBE' && <HelpCircle className="w-3.5 h-3.5 mr-1" />}
                      {userRsvp.status === 'NOT_GOING' && <XCircle className="w-3.5 h-3.5 mr-1" />}
                      {userRsvp.status}
                    </span>
                  ) : userWaitlist ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mt-1 bg-purple-100 text-purple-800">
                      Waitlisted (#{userWaitlist.position})
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 mt-1 block">No response submitted yet.</span>
                  )}
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  {isFull && !userRsvp && !userWaitlist ? (
                    <button
                      onClick={handleJoinWaitlist}
                      disabled={loadingAction}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-colors shadow-xs"
                    >
                      <ListOrdered className="w-4 h-4 mr-1.5" />
                      Join FIFO Waitlist
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRsvp('GOING')}
                        disabled={loadingAction || userRsvp?.status === 'GOING' || isFull}
                        className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                          userRsvp?.status === 'GOING'
                            ? 'bg-emerald-600 text-white cursor-default'
                            : isFull
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        {userRsvp?.status === 'GOING' ? 'Confirmed: Going' : isFull ? 'Event Full (Waitlist available)' : 'RSVP: Going'}
                      </button>

                      <button
                        onClick={() => handleRsvp('MAYBE')}
                        disabled={loadingAction || userRsvp?.status === 'MAYBE'}
                        className={`w-full py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                          userRsvp?.status === 'MAYBE'
                            ? 'bg-amber-600 text-white cursor-default'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4 mr-1.5" />
                        {userRsvp?.status === 'MAYBE' ? 'Marked: Maybe' : 'RSVP: Maybe'}
                      </button>

                      <button
                        onClick={() => handleRsvp('NOT_GOING')}
                        disabled={loadingAction || userRsvp?.status === 'NOT_GOING'}
                        className={`w-full py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                          userRsvp?.status === 'NOT_GOING'
                            ? 'bg-gray-600 text-white cursor-default'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        {userRsvp?.status === 'NOT_GOING' ? 'Marked: Not Going' : 'RSVP: Not Going'}
                      </button>

                      {userRsvp && (
                        <button
                          onClick={handleCancelRsvp}
                          disabled={loadingAction}
                          className="w-full mt-2 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium hover:bg-rose-50 rounded"
                        >
                          Cancel My RSVP
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Organizer Event Controls Box */}
          {isOrganizer && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                Organizer Event Controls
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange(event.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                  className="w-full py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  {event.status === 'PUBLISHED' ? 'Switch to Draft' : 'Publish Event'}
                </button>
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  className="w-full py-1.5 text-xs font-medium text-rose-700 border border-rose-200 rounded hover:bg-rose-50"
                >
                  Cancel Event (Alerts Attendees)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <QrCodeModal event={showQr ? event : null} onClose={() => setShowQr(false)} />

      <AnnouncementModal
        event={showAnnouncementModal ? event : null}
        organizer={currentUser}
        onClose={() => setShowAnnouncementModal(false)}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
};
