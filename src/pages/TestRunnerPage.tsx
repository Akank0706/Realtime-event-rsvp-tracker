import React, { useState } from 'react';
import { runAllAutomatedTests, type TestResultItem } from '../tests/unitAndIntegration.test';
import { Play, CheckCircle2, XCircle, ShieldCheck, Terminal, RefreshCw } from 'lucide-react';

export const TestRunnerPage: React.FC = () => {
  const [results, setResults] = useState<TestResultItem[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasRun, setHasRun] = useState<boolean>(false);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults([]);
    try {
      const res = await runAllAutomatedTests();
      setResults(res);
      setHasRun(true);
    } catch (err: any) {
      console.error('Test run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Cloud Quality Assurance & Test Suite</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Automated verification for role authorization, capacity locking, race conditions, and FIFO waitlists.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="mt-4 sm:mt-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center shadow-xs disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Executing Automated Tests...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-white" />
              Run All 16 Automated Tests
            </>
          )}
        </button>
      </div>

      {/* Summary KPI Cards if run */}
      {hasRun && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Total Tests Executed
            </span>
            <p className="text-3xl font-extrabold text-gray-900">{results.length}</p>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
              Passed
            </span>
            <p className="text-3xl font-extrabold text-emerald-700">{passCount}</p>
          </div>

          <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-200 shadow-xs">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block mb-1 flex items-center">
              <XCircle className="w-4 h-4 mr-1 text-rose-600" />
              Failed
            </span>
            <p className="text-3xl font-extrabold text-rose-700">{failCount}</p>
          </div>
        </div>
      )}

      {/* Table of Test Results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Test Execution Matrix</h2>
          <span className="text-xs text-gray-400">Section 24 & 29 Compliance</span>
        </div>

        {!hasRun && !isRunning ? (
          <div className="p-12 text-center text-xs text-gray-500">
            Click <strong>"Run All 16 Automated Tests"</strong> to execute live validation across auth, event
            CRUD, capacity constraints, concurrency races, and notifications.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Test ID</th>
                  <th className="px-4 py-3">Scenario</th>
                  <th className="px-4 py-3">Input</th>
                  <th className="px-4 py-3">Expected Result</th>
                  <th className="px-4 py-3">Actual Result</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {results.map((r) => (
                  <tr key={r.testId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">{r.testId}</td>
                    <td className="px-4 py-3 font-sans font-medium text-gray-800">{r.scenario}</td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{r.input}</td>
                    <td className="px-4 py-3 text-gray-600">{r.expectedResult}</td>
                    <td className="px-4 py-3 text-gray-800 truncate max-w-sm">{r.actualResult}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] ${
                          r.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status === 'PASS' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                        )}
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
