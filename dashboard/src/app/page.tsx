'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AnalysisRun {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  summaryMarkdown?: string;
  suggestionsJson?: any;
  createdActions: any[];
}

interface Repo {
  id: string;
  githubFullName: string;
  lastAnalyzedAt?: string;
  metaJson?: any;
  analysisRuns: AnalysisRun[];
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);

  useEffect(() => {
    fetchRepos();
    fetchQueueStats();

    // Poll queue stats every 5 seconds
    const interval = setInterval(fetchQueueStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRepos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/repos`);
      const data = await response.json();
      setRepos(data);
    } catch (error) {
      console.error('Failed to fetch repos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/stats`);
      const data = await response.json();
      setQueueStats(data);
    } catch (error) {
      console.error('Failed to fetch queue stats:', error);
    }
  };

  const discoverRepos = async () => {
    setDiscovering(true);
    try {
      const response = await fetch(`${API_URL}/api/repos/discover`, {
        method: 'POST',
      });
      const data = await response.json();
      alert(`Discovered ${data.total} repos (${data.new} new, ${data.existing} existing)`);
      fetchRepos();
    } catch (error) {
      console.error('Failed to discover repos:', error);
      alert('Failed to discover repos');
    } finally {
      setDiscovering(false);
    }
  };

  const analyzeAll = async () => {
    setAnalyzingAll(true);
    try {
      const response = await fetch(`${API_URL}/api/repos/analyze-all`, {
        method: 'POST',
      });
      const data = await response.json();
      alert(`Queued ${data.count} analysis jobs`);
      fetchQueueStats();
    } catch (error) {
      console.error('Failed to analyze all:', error);
      alert('Failed to queue analyses');
    } finally {
      setAnalyzingAll(false);
    }
  };

  const analyzeRepo = async (repoId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/repos/${repoId}/analyze`, {
        method: 'POST',
      });
      const data = await response.json();
      alert(`Analysis queued for ${data.githubFullName}`);
      fetchQueueStats();
    } catch (error) {
      console.error('Failed to analyze repo:', error);
      alert('Failed to queue analysis');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Self-Optimization Orchestrator
          </h1>
          <p className="text-gray-600">
            Automated GitHub repository health analyzer and improvement orchestrator
          </p>
        </div>

        {/* Queue Stats */}
        {queueStats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Queue Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{queueStats.waiting}</div>
                <div className="text-sm text-gray-600">Waiting</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{queueStats.active}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{queueStats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={discoverRepos}
            disabled={discovering}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {discovering ? 'Discovering...' : 'Discover Repos'}
          </button>
          <button
            onClick={analyzeAll}
            disabled={analyzingAll || repos.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzingAll ? 'Queueing...' : 'Analyze All'}
          </button>
        </div>

        {/* Repositories */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              Repositories ({repos.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : repos.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No repositories found. Click "Discover Repos" to sync from GitHub.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {repos.map((repo) => {
                const latestAnalysis = repo.analysisRuns[0];
                const healthScore = latestAnalysis?.suggestionsJson?.[0]?.healthScore ||
                                   (latestAnalysis?.suggestionsJson as any)?.healthScore;
                const suggestions = Array.isArray(latestAnalysis?.suggestionsJson)
                  ? latestAnalysis.suggestionsJson
                  : latestAnalysis?.suggestionsJson?.suggestions || [];

                return (
                  <div key={repo.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          <a
                            href={`https://github.com/${repo.githubFullName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                          >
                            {repo.githubFullName}
                          </a>
                        </h3>
                        {repo.metaJson?.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {repo.metaJson.description}
                          </p>
                        )}
                        {repo.lastAnalyzedAt && (
                          <p className="text-xs text-gray-500">
                            Last analyzed:{' '}
                            {new Date(repo.lastAnalyzedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => analyzeRepo(repo.id)}
                        className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                      >
                        Analyze
                      </button>
                    </div>

                    {latestAnalysis && (
                      <div className="mt-4 p-4 bg-gray-50 rounded">
                        <div className="flex items-center gap-4 mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              latestAnalysis.status
                            )}`}
                          >
                            {latestAnalysis.status}
                          </span>
                          {healthScore !== undefined && (
                            <span className={`text-lg font-bold ${getHealthScoreColor(healthScore)}`}>
                              Health Score: {healthScore}/100
                            </span>
                          )}
                          {latestAnalysis.createdActions.length > 0 && (
                            <span className="text-sm text-gray-600">
                              {latestAnalysis.createdActions.length} actions created
                            </span>
                          )}
                        </div>

                        {suggestions.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Suggestions:
                            </h4>
                            <ul className="space-y-1">
                              {suggestions.map((suggestion: any, idx: number) => (
                                <li key={idx} className="text-sm text-gray-600">
                                  <span className={`font-medium ${
                                    suggestion.priority === 'high' ? 'text-red-600' :
                                    suggestion.priority === 'medium' ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    [{suggestion.priority}]
                                  </span>{' '}
                                  {suggestion.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {latestAnalysis.status === 'COMPLETED' && (
                          <Link
                            href={`/analysis/${latestAnalysis.id}`}
                            className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800"
                          >
                            View full analysis →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
