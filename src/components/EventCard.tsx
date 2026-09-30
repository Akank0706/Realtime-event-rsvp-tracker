import React from 'react';
import type { EventData, RsvpStatus } from '../firebase/firestoreTypes';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  HelpCircle,
  XCircle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface EventCardProps {
  event: EventData;
  userRsvpStatus?: RsvpStatus | null;
  isWaitlisted?: boolean;
  onSelectEvent: (eventId: string) => void;
  onShowQr: (event: EventData) => void;
  onQuickRsvp?: (eventId: string, status: RsvpStatus) => void;
  isOrganizerView?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  userRsvpStatus,
  isWaitlisted,
  onSelectEvent,
  onShowQr,
  onQuickRsvp,
  isOrganizerView = false,
}) => {
  const isFull = event.goingCount >= event.capacity || event.status === 'FULL';
  const availableSeats = Math.max(0, event.capacity - event.goingCount);
  const percentFilled = Math.min(100, Math.round((event.goingCount / event.capacity) * 100));

  const getStatusBadge = () => {
    if (event.status === 'CANCELLED') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-800">Cancelled</span>;
    }
    if (event.status === 'DRAFT') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">Draft</span>;
    }
    if (isFull) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 font-bold">FULL</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">Open RSVP</span>;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Workshop':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Seminar':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Conference':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'College Event':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Meetup':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-sm">
      <div className="p-5">
        {/* Top Badges */}
        <div className="flex justify-between items-center mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
              event.category
            )}`}
          >
            {event.category}
          </span>
          <div className="flex items-center space-x-1.5">
            {getStatusBadge()}
            <button
              onClick={() => onShowQr(event)}
              className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
              title="Show Invite QR Code & Link"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <h3
          onClick={() => onSelectEvent(event.id)}
          className="text-base font-bold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-1 mb-1.5"
        >
          {event.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{event.description}</p>

        {/* Event Metadata */}
        <div className="space-y-1.5 text-xs text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span>
              {event.startTime} - {event.endTime}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span>Organized by {event.organizerName}</span>
          </div>
        </div>

        {/* Live Capacity Bar */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-gray-700 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-gray-500" />
              RSVP Capacity
            </span>
            <span className="font-bold text-gray-900">
              {event.goingCount} / {event.capacity} <span className="font-normal text-gray-500">({percentFilled}%)</span>
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 transition-all duration-500 ${
                percentFilled >= 100
                  ? 'bg-rose-500'
                  : percentFilled > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>

          {/* Counts Breakdown */}
          <div className="flex justify-between items-center text-[11px] text-gray-500 mt-2">
            <span className="text-emerald-700 font-medium">✓ Going: {event.goingCount}</span>
            <span className="text-amber-700 font-medium">? Maybe: {event.maybeCount}</span>
            <span className="text-gray-600">
              {availableSeats === 0 ? (
                <span className="text-rose-600 font-semibold">0 seats left</span>
              ) : (
                `${availableSeats} seats left`
              )}
            </span>
          </div>

          {event.waitlistCount > 0 && (
            <div className="mt-1 pt-1 border-t border-gray-200 text-[11px] text-purple-700 font-medium flex items-center justify-between">
              <span>Waitlist Queue:</span>
              <span className="font-bold">{event.waitlistCount} waiting</span>
            </div>
          )}
        </div>

        {/* User RSVP Status Badge if attendee */}
        {userRsvpStatus && (
          <div className="mb-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                userRsvpStatus === 'GOING'
                  ? 'bg-emerald-100 text-emerald-800'
                  : userRsvpStatus === 'MAYBE'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {userRsvpStatus === 'GOING' && <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
              {userRsvpStatus === 'MAYBE' && <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />}
              {userRsvpStatus === 'NOT_GOING' && <XCircle className="w-3.5 h-3.5 mr-1 text-gray-500" />}
              Your Status: {userRsvpStatus}
            </span>
          </div>
        )}

        {isWaitlisted && !userRsvpStatus && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-purple-600" />
              On Waitlist
            </span>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => onSelectEvent(event.id)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
        >
          View Details <ArrowRight className="w-3 h-3 ml-1" />
        </button>

        {!isOrganizerView && onQuickRsvp && event.status !== 'CANCELLED' && (
          <div className="flex space-x-1.5">
            {isFull && !userRsvpStatus ? (
              <button
                onClick={() => onSelectEvent(event.id)}
                className="px-2.5 py-1 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded"
              >
                Join Waitlist
              </button>
            ) : (
              <>
                <button
                  onClick={() => onQuickRsvp(event.id, 'GOING')}
                  disabled={userRsvpStatus === 'GOING' || isFull}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    userRsvpStatus === 'GOING'
                      ? 'bg-emerald-600 text-white'
                      : isFull
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Going
                </button>
                <button
                  onClick={() => onQuickRsvp(event.id, 'MAYBE')}
                  disabled={userRsvpStatus === 'MAYBE'}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    userRsvpStatus === 'MAYBE'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Maybe
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
