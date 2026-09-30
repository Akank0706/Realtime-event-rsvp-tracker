import React, { useState, useEffect } from 'react';
import type { EventCategory, EventData, UserProfile } from '../firebase/firestoreTypes';
import { getEventById, updateEvent } from '../services/eventService';
import { ArrowLeft, AlertCircle, Save } from 'lucide-react';

interface EditEventProps {
  eventId: string;
  currentUser: UserProfile;
  onBack: () => void;
  onSaved: () => void;
}

const CATEGORIES: EventCategory[] = [
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

export const EditEvent: React.FC<EditEventProps> = ({
  eventId,
  currentUser,
  onBack,
  onSaved,
}) => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Workshop');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState<number>(50);
  const [status, setStatus] = useState<any>('PUBLISHED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getEventById(eventId);
    if (existing) {
      setEvent(existing);
      setTitle(existing.title);
      setDescription(existing.description);
      setCategory(existing.category);
      setLocation(existing.location);
      setDate(existing.date);
      setStartTime(existing.startTime);
      setEndTime(existing.endTime);
      setCapacity(existing.capacity);
      setStatus(existing.status);
    }
  }, [eventId]);

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-xs text-gray-500">
        Event not found.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateEvent(
        eventId,
        {
          title,
          description,
          category,
          location,
          date,
          startTime,
          endTime,
          capacity: Number(capacity),
          status,
        },
        currentUser
      );
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center text-xs font-semibold text-gray-600 hover:text-gray-900 mb-6 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-xs">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Edit Cloud Event</h1>
          <p className="text-xs text-gray-500 mt-1">
            Update details or modify capacity. Changes sync to connected clients in real time.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Maximum Capacity (Current Confirmed Going: {event.goingCount}) *
              </label>
              <input
                type="number"
                required
                min={event.goingCount || 1}
                max={5000}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Venue Location *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Event Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="FULL">FULL</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div className="border-t border-gray-200 pt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {loading ? 'Saving Changes...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
