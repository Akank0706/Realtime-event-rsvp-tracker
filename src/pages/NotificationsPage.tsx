import React, { useState, useEffect } from 'react';
import type { NotificationRecord, UserProfile } from '../firebase/firestoreTypes';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';
import {
  Bell,
  CheckCircle,
  Megaphone,
  Clock,
  AlertCircle,
  CheckCheck,
  Calendar,
} from 'lucide-react';

interface NotificationsPageProps {
  currentUser: UserProfile;
  onSelectEvent: (eventId: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  currentUser,
  onSelectEvent,
}) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    const unsub = subscribeNotifications(currentUser.uid, (list) => {
      setNotifications(list);
    });
    return unsub;
  }, [currentUser.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead(currentUser.uid);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'EVENT_ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-purple-600" />;
      case 'WAITLIST_PROMOTED':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'RSVP_CONFIRMATION':
      case 'RSVP_CHANGED':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time alerts for RSVP status changes, capacity promotions, and organizer announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center"
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">You're all caught up!</h3>
          <p className="text-xs text-gray-500 mt-1">
            No new notifications. When you RSVP or organizers send announcements, they will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-4 transition-colors flex items-start space-x-4 cursor-pointer ${
                notif.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-xs shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{notif.title}</h4>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">{notif.message}</p>

                {notif.eventId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationRead(notif.id);
                      onSelectEvent(notif.eventId!);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View Related Event →
                  </button>
                )}
              </div>

              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
