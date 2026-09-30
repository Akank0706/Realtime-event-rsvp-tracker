import React, { useMemo } from 'react';
import type { UserProfile } from '../firebase/firestoreTypes';
import { useLiveEvents } from '../hooks/useLiveEvent';
import { computeOrganizerAnalytics } from '../services/analyticsService';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Clock,
  PieChart,
  Layers,
  ArrowLeft,
} from 'lucide-react';

interface AnalyticsPageProps {
  currentUser: UserProfile;
  onBack: () => void;
  onSelectEvent: (eventId: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  currentUser,
  onBack,
  onSelectEvent,
}) => {
  // Listen to live events so analytics recalculate in real-time when RSVPs change
  const { events } = useLiveEvents();

  const analytics = useMemo(() => {
    return computeOrganizerAnalytics(
      currentUser.role === 'organizer' ? currentUser.uid : undefined
    );
  }, [events, currentUser]);

  const maxRsvpsInEvent = Math.max(
    1,
    ...analytics.eventPerformance.map((e) => e.going + e.maybe)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-8">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center text-xs font-semibold text-gray-600 hover:text-gray-900 mb-2 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Event RSVP & Capacity Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dynamic metrics calculated in real-time from active cloud Firestore records.
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Real-Time Engine Sync Active
          </span>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total RSVPs</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{analytics.totalRsvps}</p>
          <span className="text-xs text-gray-400 mt-1 block">Across {analytics.totalEvents} events</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Capacity Fill</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">{analytics.capacityUtilization}%</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">
            {analytics.goingCount} of {analytics.totalCapacity} seats filled
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Going Ratio</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold text-indigo-600">{analytics.goingPercentage}%</p>
          <span className="text-xs text-gray-400 mt-1 block">
            {analytics.goingCount} confirmed / {analytics.totalRsvps} responses
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Category</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-purple-700 truncate">{analytics.mostPopularCategory}</p>
          <span className="text-xs text-gray-400 mt-1 block">Highest attendee engagement</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Chart 1: RSVP Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-blue-600" />
              RSVP Status Distribution
            </h3>
            <span className="text-xs text-gray-400">{analytics.totalRsvps} total responses</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Going (Confirmed)
                </span>
                <span>
                  {analytics.goingCount} ({analytics.goingPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.goingPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center text-amber-700 font-semibold">
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  Maybe (Tentative)
                </span>
                <span>
                  {analytics.maybeCount} ({analytics.maybePercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.maybePercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center text-gray-600 font-semibold">
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Not Going (Declined)
                </span>
                <span>
                  {analytics.notGoingCount} ({analytics.notGoingPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gray-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.notGoingPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-indigo-600" />
              Category Engagement & Distribution
            </h3>
            <span className="text-xs text-gray-400">Total events & RSVPs</span>
          </div>

          {analytics.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No category data yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="text-xs">
                  <div className="flex justify-between text-gray-700 font-medium mb-1">
                    <span>{cat.category}</span>
                    <span className="text-gray-500">
                      {cat.count} events • {cat.rsvps} RSVPs
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((cat.rsvps / Math.max(1, analytics.totalRsvps)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event-by-Event Roster & Utilization Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">Per-Event Attendance & Capacity Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">Calculated in real-time from active event documents</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Event Title</th>
                <th className="px-6 py-3">Capacity</th>
                <th className="px-6 py-3">Going</th>
                <th className="px-6 py-3">Maybe</th>
                <th className="px-6 py-3">Not Going</th>
                <th className="px-6 py-3">Waitlist</th>
                <th className="px-6 py-3">Capacity Filled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics.eventPerformance.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => onSelectEvent(item.id)}
                      className="font-bold text-gray-900 hover:text-blue-600 text-left cursor-pointer"
                    >
                      {item.title}
                    </button>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-gray-700">{item.capacity}</td>
                  <td className="px-6 py-3.5 font-semibold text-emerald-700">{item.going}</td>
                  <td className="px-6 py-3.5 font-medium text-amber-700">{item.maybe}</td>
                  <td className="px-6 py-3.5 text-gray-500">{item.notGoing}</td>
                  <td className="px-6 py-3.5 text-purple-700 font-medium">{item.waitlist}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            item.utilizationRate >= 100
                              ? 'bg-rose-500'
                              : item.utilizationRate > 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${item.utilizationRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-800">{item.utilizationRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
