import React, { useState } from 'react';
import type { EventData, UserProfile } from '../firebase/firestoreTypes';
import { sendOrganizerAnnouncement } from '../services/notificationService';
import { X, Send, Megaphone, AlertCircle } from 'lucide-react';

interface AnnouncementModalProps {
  event: EventData | null;
  organizer: UserProfile;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  event,
  organizer,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!event) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Please provide both an announcement title and message.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendOrganizerAnnouncement({
        eventId: event.id,
        title,
        message,
        organizer,
      });
      onSuccess(`Announcement broadcast to attendees of "${event.title}".`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Broadcast Event Announcement</h3>
            <p className="text-xs text-gray-500">Delivers in-app notifications directly to attendees</p>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 text-xs text-gray-600">
          Target Event: <span className="font-semibold text-gray-900">{event.title}</span> ({event.goingCount} Going, {event.maybeCount} Maybe)
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Announcement Topic / Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Venue Updated to Complex Hall B, Start Time Adjusted"
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Detailed Message & Instructions
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide instructions, updated meeting links, parking details, or schedule adjustments..."
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {loading ? 'Broadcasting...' : 'Broadcast to Attendees'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
