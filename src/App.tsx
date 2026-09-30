import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { DemoBanner } from './components/DemoBanner';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { AttendeeDashboard } from './pages/AttendeeDashboard';
import { BrowseEvents } from './pages/BrowseEvents';
import { EventDetails } from './pages/EventDetails';
import { CreateEvent } from './pages/CreateEvent';
import { EditEvent } from './pages/EditEvent';
import { MyRsvps } from './pages/MyRsvps';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ConcurrencyLab } from './pages/ConcurrencyLab';
import { TestRunnerPage } from './pages/TestRunnerPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { seedInitialDataIfNeeded } from './services/dbStore';

export default function App() {
  const {
    currentUser,
    isOrganizer,
    isAuthenticated,
    demoUsers,
    login,
    register,
    logout,
    switchDemoUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Check URL query parameters for direct event link (e.g. from QR scan: ?event=evt_123)
  useEffect(() => {
    seedInitialDataIfNeeded();
    const urlParams = new URLSearchParams(window.location.search);
    const eventParam = urlParams.get('event') || urlParams.get('e');
    if (eventParam) {
      setSelectedEventId(eventParam);
      setActiveTab('event-details');
    }
  }, []);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('event-details');
  };

  const handleEditEvent = (eventId: string) => {
    setEditingEventId(eventId);
    setActiveTab('edit-event');
  };

  const handleEventCreated = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('event-details');
  };

  const handleEventSaved = () => {
    setActiveTab('events');
  };

  const handleQuickLogin = (uid: string) => {
    switchDemoUser(uid);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Demo Banner for Examiners & Multi-Tab Real-Time Syncing */}
      <DemoBanner
        currentUser={currentUser}
        onSwitchUser={switchDemoUser}
        onNavigateTab={(tab) => setActiveTab(tab)}
        demoUsers={demoUsers}
      />

      {/* Main Role-Aware Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
        onSwitchUser={switchDemoUser}
        demoUsers={demoUsers}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {!isAuthenticated ? (
          activeTab === 'register' ? (
            <Register
              onRegister={register}
              onSwitchToLogin={() => setActiveTab('login')}
            />
          ) : (
            <Login
              onLogin={login}
              onSwitchToRegister={() => setActiveTab('register')}
              onQuickLogin={handleQuickLogin}
            />
          )
        ) : (
          <>
            {/* Dashboard: Routed dynamically by role */}
            {activeTab === 'dashboard' && (
              isOrganizer ? (
                <OrganizerDashboard
                  currentUser={currentUser!}
                  setActiveTab={setActiveTab}
                  onSelectEvent={handleSelectEvent}
                  onEditEvent={handleEditEvent}
                />
              ) : (
                <AttendeeDashboard
                  currentUser={currentUser!}
                  setActiveTab={setActiveTab}
                  onSelectEvent={handleSelectEvent}
                />
              )
            )}

            {/* Organizer Manage Events */}
            {activeTab === 'events' && (
              <OrganizerDashboard
                currentUser={currentUser!}
                setActiveTab={setActiveTab}
                onSelectEvent={handleSelectEvent}
                onEditEvent={handleEditEvent}
              />
            )}

            {/* Create Event (Organizer Only) */}
            {activeTab === 'create-event' && (
              <CreateEvent
                currentUser={currentUser!}
                onBack={() => setActiveTab('dashboard')}
                onEventCreated={handleEventCreated}
              />
            )}

            {/* Edit Event (Organizer Only) */}
            {activeTab === 'edit-event' && editingEventId && (
              <EditEvent
                eventId={editingEventId}
                currentUser={currentUser!}
                onBack={() => setActiveTab('dashboard')}
                onSaved={handleEventSaved}
              />
            )}

            {/* Public / Attendee Discovery */}
            {activeTab === 'browse' && (
              <BrowseEvents
                currentUser={currentUser!}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {/* Attendee My RSVPs */}
            {activeTab === 'my-rsvps' && (
              <MyRsvps
                currentUser={currentUser!}
                onSelectEvent={handleSelectEvent}
                onBrowse={() => setActiveTab('browse')}
              />
            )}

            {/* Event Details View with Live Counters & RSVP Actions */}
            {activeTab === 'event-details' && selectedEventId && (
              <EventDetails
                eventId={selectedEventId}
                currentUser={currentUser!}
                onBack={() => setActiveTab(isOrganizer ? 'events' : 'browse')}
                onEdit={handleEditEvent}
              />
            )}

            {/* Real-time Analytics */}
            {activeTab === 'analytics' && (
              <AnalyticsPage
                currentUser={currentUser!}
                onBack={() => setActiveTab('dashboard')}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {/* Notifications Center */}
            {activeTab === 'notifications' && (
              <NotificationsPage
                currentUser={currentUser!}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {/* Concurrency Laboratory (Race Condition Test) */}
            {activeTab === 'concurrency-lab' && (
              <ConcurrencyLab currentUser={currentUser!} />
            )}

            {/* Quality Assurance & Automated Test Runner */}
            {activeTab === 'test-runner' && <TestRunnerPage />}

            {/* User Profile & Role Info */}
            {activeTab === 'profile' && <ProfilePage currentUser={currentUser!} />}
          </>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-800">
              Real-Time Cloud-Based Event Planning & RSVP Tracker
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Cloud Computing Course Capstone • Powered by Firebase Firestore Real-Time Listeners
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <button
              onClick={() => setActiveTab('concurrency-lab')}
              className="hover:text-blue-600 transition-colors"
            >
              Concurrency Lab
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('test-runner')}
              className="hover:text-blue-600 transition-colors"
            >
              Test Suite Matrix
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('profile')}
              className="hover:text-blue-600 transition-colors"
            >
              Cloud RBAC
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
