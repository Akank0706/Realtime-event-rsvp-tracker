import React from 'react';
import type { UserProfile } from '../firebase/firestoreTypes';
import { isFirebaseConfigured, firebaseConfig } from '../firebase/config';
import { Shield, User, Cloud, Database, Radio, CheckCircle, ExternalLink } from 'lucide-react';

interface ProfilePageProps {
  currentUser: UserProfile;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="pb-6 border-b border-gray-200 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Profile & Cloud Architecture</h1>
        <p className="text-sm text-gray-500 mt-1">
          Active authentication identity, Role-Based Access Control (RBAC), and cloud synchronization specs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold mx-auto mb-4">
            {currentUser.name.charAt(0)}
          </div>
          <h2 className="text-center text-base font-bold text-gray-900">{currentUser.name}</h2>
          <p className="text-center text-xs text-gray-500 mt-0.5">{currentUser.email}</p>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">User ID:</span>
              <span className="font-mono text-gray-700 truncate max-w-[130px]">{currentUser.uid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Assigned Role:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                  currentUser.role === 'organizer'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {currentUser.role}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-gray-700">
                {new Date(currentUser.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Cloud Architecture Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Cloud className="w-4 h-4 mr-2 text-blue-600" />
              Cloud Architecture & Real-Time Sync Mode
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-800 block">Database Synchronization Engine</span>
                  <span className="text-gray-500 text-[11px]">
                    {isFirebaseConfigured
                      ? 'Connected to Google Cloud Firestore (Managed NoSQL Database)'
                      : 'Live Multi-Window Sync (BroadcastChannel & Local Storage Atomic Engine)'}
                  </span>
                </div>
                <span className="px-2 py-1 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center">
                  <Radio className="w-3 h-3 mr-1 animate-pulse text-emerald-600" />
                  Active
                </span>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-800 block">Security Rules Engine</span>
                  <span className="text-gray-500 text-[11px]">
                    Role-Based Access Control (RBAC) enforced via <code>firestore.rules</code>
                  </span>
                </div>
                <span className="px-2 py-1 rounded text-[11px] font-bold bg-blue-100 text-blue-800 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 text-blue-600" />
                  Enforced
                </span>
              </div>
            </div>
          </div>

          {/* Two-Browser Demonstration Guide */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-6 text-xs text-emerald-900">
            <h3 className="text-sm font-bold text-emerald-950 mb-2 flex items-center">
              <Radio className="w-4 h-4 mr-1.5 text-emerald-700" />
              How to Perform the Real-Time Viva Demonstration
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-emerald-900/90">
              <li>
                Open <strong>Window 1</strong> (e.g. Chrome) and switch profile to{' '}
                <span className="font-bold">Alex Rivera (Organizer)</span>.
              </li>
              <li>
                Open <strong>Window 2</strong> (e.g. Incognito or side-by-side tab) and switch profile to{' '}
                <span className="font-bold">Sam Chen (Attendee)</span>.
              </li>
              <li>
                In Window 2 (Attendee), select an event and click <strong>Going</strong> or{' '}
                <strong>Maybe</strong>.
              </li>
              <li>
                Observe Window 1 (Organizer Dashboard) — the Going counter and available capacity update{' '}
                <strong>instantaneously without a page refresh!</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
