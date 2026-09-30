import React, { useState } from 'react';
import type { UserProfile } from '../firebase/firestoreTypes';
import { DEMO_USERS } from '../services/authService';
import { Calendar, Lock, Mail, ArrowRight, AlertCircle, Users, Check } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<UserProfile>;
  onSwitchToRegister: () => void;
  onQuickLogin: (uid: string) => void;
}

export const Login: React.FC<LoginProps> = ({
  onLogin,
  onSwitchToRegister,
  onQuickLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in to CloudRSVP</h2>
        <p className="text-xs text-gray-500 mt-1">
          Real-Time Cloud-Based Event Planning & RSVP Tracker
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.organizer@campuscloud.edu"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Logins (Viva & Examiner Friendly) */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
              1-Click Demo Profiles (For Viva & Real-Time Sync)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => onQuickLogin(user.uid)}
                  type="button"
                  className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-gray-800 text-xs block">{user.name}</span>
                    <span className="text-[10px] text-gray-400">{user.email}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      user.role === 'organizer' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-semibold text-blue-600 hover:text-blue-800 ml-1"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
