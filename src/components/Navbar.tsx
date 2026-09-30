import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../firebase/firestoreTypes';
import { subscribeNotifications } from '../services/notificationService';
import {
  Calendar,
  PlusCircle,
  BarChart3,
  Bell,
  LogOut,
  User,
  Users,
  Compass,
  CheckCircle2,
  Zap,
  Layers,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchUser: (uid: string) => void;
  demoUsers: UserProfile[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchUser,
  demoUsers,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeNotifications(currentUser.uid, (list) => {
      const count = list.filter((n) => !n.read).length;
      setUnreadCount(count);
    });
    return unsub;
  }, [currentUser]);

  const isOrganizer = currentUser?.role === 'organizer';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">CloudRSVP</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  <Radio className="w-3 h-3 mr-1 animate-pulse text-emerald-600" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">Real-Time Event Planning & RSVP Tracker</p>
            </div>
          </div>

          {/* Navigation Items */}
          {currentUser && (
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>

              {isOrganizer ? (
                <>
                  <button
                    onClick={() => setActiveTab('events')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'events'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Manage Events
                  </button>
                  <button
                    onClick={() => setActiveTab('create-event')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'create-event'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Create Event
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'analytics'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 mr-1.5" />
                    RSVP Analytics
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'browse'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Compass className="w-4 h-4 mr-1.5" />
                    Browse Events
                  </button>
                  <button
                    onClick={() => setActiveTab('my-rsvps')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'my-rsvps'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    My RSVPs
                  </button>
                </>
              )}

              {/* Concurrency Test Lab (Crucial for Cloud viva & demonstration) */}
              <button
                onClick={() => setActiveTab('concurrency-lab')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'concurrency-lab'
                    ? 'bg-amber-50 text-amber-800 font-semibold'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
                title="Simulate 2 concurrent users attempting to claim the final capacity slot"
              >
                <Zap className="w-4 h-4 mr-1.5 text-amber-500" />
                Concurrency Lab
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`relative flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-4 h-4 mr-1.5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1.5 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            </nav>
          )}

          {/* User Controls & Multi-Tab Tester */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-xs">
                    <p className="font-semibold text-gray-900 leading-tight">{currentUser.name}</p>
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wide ${
                        isOrganizer ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Current Session</p>
                      <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 capitalize">
                        Role: {currentUser.role}
                      </span>
                    </div>

                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        Quick Role Switch (For Live Demo)
                      </p>
                      <div className="space-y-1">
                        {demoUsers.map((u) => (
                          <button
                            key={u.uid}
                            onClick={() => {
                              onSwitchUser(u.uid);
                              setUserDropdownOpen(false);
                            }}
                            className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center justify-between ${
                              currentUser.uid === u.uid
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span>{u.name}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setActiveTab('profile');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <User className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        User Profile & Cloud Role
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md"
                >
                  Log In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        {currentUser && (
          <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-gray-100 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            {isOrganizer ? (
              <>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
                    activeTab === 'events' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100'
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => setActiveTab('create-event')}
                  className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
                    activeTab === 'create-event' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100'
                  }`}
                >
                  Create
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
                    activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100'
                  }`}
                >
                  Analytics
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
                    activeTab === 'browse' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => setActiveTab('my-rsvps')}
                  className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
                    activeTab === 'my-rsvps' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100'
                  }`}
                >
                  My RSVPs
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('concurrency-lab')}
              className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
                activeTab === 'concurrency-lab' ? 'bg-amber-600 text-white' : 'text-amber-800 bg-amber-100'
              }`}
            >
              ⚡ Concurrency
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
                activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100'
              }`}
            >
              Alerts ({unreadCount})
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
