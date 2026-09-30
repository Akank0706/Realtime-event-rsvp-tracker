import React, { useState } from 'react';
import type { UserProfile, UserRole } from '../firebase/firestoreTypes';
import { Calendar, Lock, Mail, User, Shield, AlertCircle } from 'lucide-react';

interface RegisterProps {
  onRegister: (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<UserProfile>;
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('attendee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onRegister({ name, email, password, role });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create CloudRSVP Account</h2>
        <p className="text-xs text-gray-500 mt-1">
          Select role to configure Organizer or Attendee permissions
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
              <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera or Sam Chen"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@campuscloud.edu"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`border rounded-lg p-3 cursor-pointer flex flex-col justify-between transition-colors ${
                    role === 'attendee'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="attendee"
                    checked={role === 'attendee'}
                    onChange={() => setRole('attendee')}
                    className="sr-only"
                  />
                  <span className="font-bold text-xs">Attendee</span>
                  <span className="text-[10px] text-gray-500 mt-1">
                    Discover events, RSVP Going/Maybe, and join waitlists.
                  </span>
                </label>

                <label
                  className={`border rounded-lg p-3 cursor-pointer flex flex-col justify-between transition-colors ${
                    role === 'organizer'
                      ? 'border-purple-500 bg-purple-50/50 text-purple-900'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="organizer"
                    checked={role === 'organizer'}
                    onChange={() => setRole('organizer')}
                    className="sr-only"
                  />
                  <span className="font-bold text-xs">Organizer</span>
                  <span className="text-[10px] text-gray-500 mt-1">
                    Create events, manage capacity, live dashboard & broadcast alerts.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Creating Account in Cloud...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold text-blue-600 hover:text-blue-800 ml-1"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
