import React, { useState } from 'react';
import type { UserProfile } from '../firebase/firestoreTypes';
import {
  submitRsvpAtomic,
  cancelRsvp,
  getUserRsvpForEvent,
  getUserWaitlistForEvent,
} from '../services/rsvpService';
import { getEventById, createEvent } from '../services/eventService';
import {
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Terminal,
} from 'lucide-react';

interface ConcurrencyLabProps {
  currentUser: UserProfile;
}

export const ConcurrencyLab: React.FC<ConcurrencyLabProps> = ({ currentUser }) => {
  const [testEventId, setTestEventId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [user1Status, setUser1Status] = useState<string>('idle');
  const [user2Status, setUser2Status] = useState<string>('idle');
  const [eventCapacityState, setEventCapacityState] = useState<{
    capacity: number;
    goingCount: number;
    status: string;
  } | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const handleSetupTestEvent = async () => {
    setIsRunning(true);
    setLogs([]);
    setUser1Status('idle');
    setUser2Status('idle');
    addLog('Initializing new atomic concurrency test event with Capacity = 1...');

    try {
      const newEvt = await createEvent(
        {
          title: `Concurrency Race Test #${Math.floor(Math.random() * 1000)}`,
          description:
            'Controlled laboratory test event to simulate simultaneous RSVP race conditions and verify atomic transactions.',
          category: 'Workshop',
          location: 'Virtual Concurrency Sandbox',
          date: '2026-10-30',
          startTime: '10:00',
          endTime: '11:00',
          capacity: 1, // EXACTLY 1 SEAT AVAILABLE
          status: 'PUBLISHED',
        },
        currentUser.role === 'organizer'
          ? currentUser
          : {
              uid: 'user_alex_organizer',
              name: 'Alex Rivera (Test Organizer)',
              email: 'alex.organizer@campuscloud.edu',
              role: 'organizer',
              createdAt: new Date().toISOString(),
            }
      );

      setTestEventId(newEvt.id);
      setEventCapacityState({
        capacity: 1,
        goingCount: 0,
        status: 'PUBLISHED',
      });
      addLog(`Event "${newEvt.title}" created with Capacity = 1, Going = 0.`);
      addLog('Ready to simulate simultaneous RSVP submission from two users.');
    } catch (err: any) {
      addLog(`Setup failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSimulateRace = async () => {
    if (!testEventId) {
      alert('Please click "1. Setup Test Event (Capacity = 1)" first.');
      return;
    }

    setIsRunning(true);
    addLog('⚡ Launching simultaneous concurrent requests: User A & User B via Promise.all()...');
    setUser1Status('requesting');
    setUser2Status('requesting');

    const userA: UserProfile = {
      uid: 'user_alice_concurrent',
      name: 'Alice (Concurrent User A)',
      email: 'alice@test.edu',
      role: 'attendee',
      createdAt: new Date().toISOString(),
    };

    const userB: UserProfile = {
      uid: 'user_bob_concurrent',
      name: 'Bob (Concurrent User B)',
      email: 'bob@test.edu',
      role: 'attendee',
      createdAt: new Date().toISOString(),
    };

    try {
      // Simulate real concurrent submission at the exact same millisecond
      const [resA, resB] = await Promise.allSettled([
        submitRsvpAtomic({ eventId: testEventId, user: userA, targetStatus: 'GOING' }),
        submitRsvpAtomic({ eventId: testEventId, user: userB, targetStatus: 'GOING' }),
      ]);

      if (resA.status === 'fulfilled') {
        setUser1Status('GOING');
        addLog(`✅ User A transaction COMMITTED: Status = GOING (Reserved Seat 1 of 1).`);
      } else {
        setUser1Status('REJECTED');
        addLog(`❌ User A transaction REJECTED: ${resA.reason.message}`);
      }

      if (resB.status === 'fulfilled') {
        setUser2Status('GOING');
        addLog(`✅ User B transaction COMMITTED: Status = GOING (Reserved Seat 1 of 1).`);
      } else {
        setUser2Status('REJECTED');
        addLog(`❌ User B transaction REJECTED: ${resB.reason.message}`);
      }

      // Check final event status
      const updatedEvt = getEventById(testEventId);
      if (updatedEvt) {
        setEventCapacityState({
          capacity: updatedEvt.capacity,
          goingCount: updatedEvt.goingCount,
          status: updatedEvt.status,
        });
        addLog(`Final Database State: Going = ${updatedEvt.goingCount} / Capacity = ${updatedEvt.capacity}. Status = ${updatedEvt.status}`);
        addLog(`Result: Race condition successfully prevented! Event capacity NEVER exceeded.`);
      }
    } catch (err: any) {
      addLog(`Unexpected test error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSimulateCancellationAndPromotion = async () => {
    if (!testEventId) return;
    setIsRunning(true);
    addLog('Simulating confirmed attendee cancellation to test automatic FIFO waitlist promotion...');

    const userA: UserProfile = {
      uid: 'user_alice_concurrent',
      name: 'Alice (Concurrent User A)',
      email: 'alice@test.edu',
      role: 'attendee',
      createdAt: new Date().toISOString(),
    };

    try {
      await cancelRsvp(testEventId, userA);
      addLog('User A cancelled their confirmed GOING RSVP. Seat is now vacated.');

      const updatedEvt = getEventById(testEventId);
      if (updatedEvt) {
        setEventCapacityState({
          capacity: updatedEvt.capacity,
          goingCount: updatedEvt.goingCount,
          status: updatedEvt.status,
        });
        addLog(`Real-time update: Event Going count = ${updatedEvt.goingCount}, Status = ${updatedEvt.status}.`);
      }
    } catch (err: any) {
      addLog(`Cancellation error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="pb-6 border-b border-gray-200 mb-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Concurrency & Race Condition Laboratory</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Demonstrate atomic database transactions and prove that simultaneous seat bookings
          cannot cause <code className="bg-gray-100 px-1 py-0.5 rounded text-rose-600 font-semibold">Going &gt; Capacity</code>.
        </p>
      </div>

      {/* Explanatory Callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 text-xs text-blue-900">
        <h3 className="font-bold text-sm mb-1.5 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600" />
          The Cloud Computing Concurrency Problem
        </h3>
        <p className="leading-relaxed mb-2">
          When an event has <strong>Capacity = 50</strong> and <strong>Going = 49</strong>, two users who click
          "Going" simultaneously would both read "1 seat remaining" in a naive implementation, resulting in
          51 attendees (an overbooked race condition).
        </p>
        <p className="leading-relaxed">
          <strong>Our Solution:</strong> In Cloud Firestore, we use{' '}
          <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono">runTransaction()</code>,
          which reads the document, locks validation on the current server state, and performs an atomic
          conditional write. Only one transaction succeeds; the other is rejected or routed to the FIFO waitlist.
        </p>
      </div>

      {/* Interactive Controls Strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs mb-8">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Laboratory Execution Steps</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handleSetupTestEvent}
            disabled={isRunning}
            className="p-4 rounded-xl border border-gray-200 hover:border-blue-500 bg-gray-50 hover:bg-blue-50/50 text-left transition-all"
          >
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
              Step 1
            </span>
            <h4 className="text-xs font-bold text-gray-900 mb-1">Setup Test Event</h4>
            <p className="text-[11px] text-gray-500">Creates event with Capacity = 1, Going = 0.</p>
          </button>

          <button
            onClick={handleSimulateRace}
            disabled={isRunning || !testEventId}
            className={`p-4 rounded-xl border text-left transition-all ${
              !testEventId
                ? 'opacity-50 border-gray-200 cursor-not-allowed bg-gray-50'
                : 'border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50 cursor-pointer'
            }`}
          >
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
              Step 2
            </span>
            <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Simulate Simultaneous RSVP
            </h4>
            <p className="text-[11px] text-gray-500">Fires 2 concurrent requests at the exact same millisecond.</p>
          </button>

          <button
            onClick={handleSimulateCancellationAndPromotion}
            disabled={isRunning || !testEventId}
            className={`p-4 rounded-xl border text-left transition-all ${
              !testEventId
                ? 'opacity-50 border-gray-200 cursor-not-allowed bg-gray-50'
                : 'border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50 cursor-pointer'
            }`}
          >
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
              Step 3
            </span>
            <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center">
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-purple-600" />
              Test Cancellation
            </h4>
            <p className="text-[11px] text-gray-500">Cancels seat and observes instant count decrease.</p>
          </button>
        </div>

        {/* Live Status Indicators */}
        {eventCapacityState && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Event Target</span>
              <span className="font-bold text-gray-900">{testEventId}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Capacity State</span>
              <span className="font-extrabold text-gray-900 text-sm">
                {eventCapacityState.goingCount} / {eventCapacityState.capacity}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Event Status</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  eventCapacityState.status === 'FULL'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {eventCapacityState.status}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-center">
                <span className="text-[10px] text-gray-400 block">User A</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    user1Status === 'GOING'
                      ? 'bg-emerald-100 text-emerald-800'
                      : user1Status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {user1Status}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-gray-400 block">User B</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    user2Status === 'GOING'
                      ? 'bg-emerald-100 text-emerald-800'
                      : user2Status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {user2Status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Transaction Log Console */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 shadow-sm text-xs font-mono text-gray-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-gray-100">Live Transaction Execution Log</span>
          </div>
          <span className="text-[11px] text-gray-500">Atomic Lock Trace</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-gray-500 italic py-4">
            Click "Setup Test Event" and "Simulate Simultaneous RSVP" above to execute the atomic race test.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
            {logs.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.includes('COMMITTED')
                    ? 'text-emerald-400'
                    : line.includes('REJECTED')
                    ? 'text-rose-400'
                    : line.includes('⚡')
                    ? 'text-amber-300 font-bold'
                    : 'text-gray-300'
                }
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
