// src/app/dashboard/page.js
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/auth/login');
      } else {
        fetchCandidates();
      }
    });
  }, [router]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      
      // Get candidates with their latest scores
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          id,
          full_name,
          email,
          location,
          created_at,
          resumes (id),
          chat_sessions (id, summary, ended_at),
          scores (category, score, created_at)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Process candidates to add useful metadata
      const processedCandidates = data.map(candidate => {
        // Check if candidate has a resume
        const hasResume = candidate.resumes && candidate.resumes.length > 0;
        
        // Check if candidate has completed a chat
        const hasCompletedChat = candidate.chat_sessions && 
          candidate.chat_sessions.some(session => session.ended_at !== null);
        
        // Get latest scores per category
        const scoresByCategory = {};
        
        if (candidate.scores) {
          candidate.scores.forEach(score => {
            if (!scoresByCategory[score.category] || 
                new Date(score.created_at) > new Date(scoresByCategory[score.category].created_at)) {
              scoresByCategory[score.category] = score;
            }
          });
        }
        
        // Calculate average score
        const scores = Object.values(scoresByCategory).map(s => s.score);
        const averageScore = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
          : null;
        
        // Determine stage in process
        let stage = 'new';
        if (hasResume && hasCompletedChat && averageScore !== null) {
          stage = 'scored';
        } else if (hasResume && hasCompletedChat) {
          stage = 'interviewed';
        } else if (hasResume) {
          stage = 'resume_uploaded';
        }
        
        return {
          ...candidate,
          hasResume,
          hasCompletedChat,
          averageScore,
          stage,
          latestScores: scoresByCategory
        };
      });

      setCandidates(processedCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates based on selected filter and search term
  const filteredCandidates = candidates.filter(candidate => {
    // Apply stage filter
    if (filter !== 'all' && candidate.stage !== filter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        candidate.full_name?.toLowerCase().includes(searchLower) ||
        candidate.email?.toLowerCase().includes(searchLower) ||
        candidate.location?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Get score color
  const getScoreColor = (score) => {
    if (score === null) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-blue-700">TalentMatchAI</div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Candidate Dashboard</h1>
          <Link
            href="/candidates/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add New Candidate
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search candidates..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg border ${filter === 'all' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`px-4 py-2 rounded-lg border ${filter === 'new' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                onClick={() => setFilter('new')}
              >
                New
              </button>
              <button
                className={`px-4 py-2 rounded-lg border ${filter === 'resume_uploaded' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                onClick={() => setFilter('resume_uploaded')}
              >
                Resume Uploaded
              </button>
              <button
                className={`px-4 py-2 rounded-lg border ${filter === 'interviewed' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                onClick={() => setFilter('interviewed')}
              >
                Interviewed
              </button>
              <button
                className={`px-4 py-2 rounded-lg border ${filter === 'scored' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                onClick={() => setFilter('scored')}
              >
                Scored
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <p className="text-gray-500">No candidates found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-medium text-blue-800">
                            {candidate.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{candidate.full_name}</div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                          {candidate.location && (
                            <div className="text-xs text-gray-500">{candidate.location}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${candidate.stage === 'new' ? 'bg-gray-100 text-gray-800' : ''}
                        ${candidate.stage === 'resume_uploaded' ? 'bg-blue-100 text-blue-800' : ''}
                        ${candidate.stage === 'interviewed' ? 'bg-purple-100 text-purple-800' : ''}
                        ${candidate.stage === 'scored' ? 'bg-green-100 text-green-800' : ''}
                      `}>
                        {candidate.stage === 'new' && 'New Candidate'}
                        {candidate.stage === 'resume_uploaded' && 'Resume Uploaded'}
                        {candidate.stage === 'interviewed' && 'Interview Completed'}
                        {candidate.stage === 'scored' && 'Fully Evaluated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.averageScore !== null ? (
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-medium ${getScoreColor(candidate.averageScore)}`}>
                            {candidate.averageScore}
                          </div>
                          {candidate.averageScore >= 80 && (
                            <span className="ml-2 text-xs text-green-600 font-medium">Top Candidate</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not scored yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/candidates/${candidate.id}/edit`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}