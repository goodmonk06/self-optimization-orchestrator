'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Analysis {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  summaryMarkdown?: string;
  suggestionsJson?: any;
  errorMessage?: string;
  repo: {
    githubFullName: string;
  };
  createdActions: Array<{
    id: string;
    type: string;
    targetUrl?: string;
    createdAt: string;
  }>;
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [params.id]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`${API_URL}/api/analysis/${params.id}`);
      if (!response.ok) {
        throw new Error('Analysis not found');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      alert('Failed to load analysis');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Analysis not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/')}
          className="mb-6 text-blue-600 hover:text-blue-800"
        >
          ← Back to repositories
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {analysis.repo.githubFullName}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Status: {analysis.status}</span>
            <span>Started: {new Date(analysis.startedAt).toLocaleString()}</span>
            {analysis.finishedAt && (
              <span>Finished: {new Date(analysis.finishedAt).toLocaleString()}</span>
            )}
          </div>
        </div>

        {analysis.status === 'FAILED' && analysis.errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{analysis.errorMessage}</p>
          </div>
        )}

        {analysis.createdActions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Created Actions</h2>
            <div className="space-y-2">
              {analysis.createdActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{action.type}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {new Date(action.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {action.targetUrl && (
                    <a
                      href={action.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View on GitHub →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.summaryMarkdown && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="prose max-w-none">
              <ReactMarkdown>{analysis.summaryMarkdown}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
