import React from 'react';
import type { UserProfile } from '../firebase/firestoreTypes';
import { Radio, Users, Zap, CheckCircle2, Copy, Check } from 'lucide-react';

interface DemoBannerProps {
  currentUser: UserProfile | null;
  onSwitchUser: (uid: string) => void;
  onNavigateTab: (tab: string) => void;
  demoUsers: UserProfile[];
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  currentUser,
  onSwitchUser,
  onNavigateTab,
  demoUsers,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyDemoUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside aria-label="Cloud sync instructions" className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-2 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="flex items-center text-emerald-400 font-semibold">
            <Radio className="w-3.5 h-3.5 mr-1 animate-pulse" />
            Two-Browser Real-Time Sync Ready
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">
            Open an Incognito/Second window to see Going/Capacity update in real time with 0 refresh.
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <button
            onClick={handleCopyDemoUrl}
            className="text-slate-300 hover:text-white flex items-center bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded"
            title="Copy URL to open in secondary tab"
          >
            {copied ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? 'URL Copied!' : 'Copy Demo URL'}
          </button>

          <button
            onClick={() => onNavigateTab('concurrency-lab')}
            className="text-amber-300 hover:text-amber-200 font-semibold flex items-center bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded"
          >
            <Zap className="w-3 h-3 mr-1 text-amber-400" />
            Concurrency Lab
          </button>

          <button
            onClick={() => onNavigateTab('test-runner')}
            className="text-emerald-300 hover:text-emerald-200 font-semibold flex items-center bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded"
          >
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
            Run QA Tests
          </button>
        </div>
      </div>
    </aside>
  );
};
