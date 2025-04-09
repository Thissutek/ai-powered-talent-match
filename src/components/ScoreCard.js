// src/components/ScoreCard.js
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ScoreCard({ candidateId }) {
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchScores() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('scores')
          .select('category, score, notes, created_by, created_at')
          .eq('candidate_id', candidateId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by category and take the most recent
        const latestScores = {};
        data.forEach(item => {
          if (!latestScores[item.category] || new Date(item.created_at) > new Date(latestScores[item.category].created_at)) {
            latestScores[item.category] = item;
          }
        });

        setScores(Object.values(latestScores));
      } catch (err) {
        console.error('Error fetching scores:', err);
        setError('Failed to load candidate scores');
      } finally {
        setLoading(false);
      }
    }

    if (candidateId) {
      fetchScores();
    }
  }, [candidateId]);

  // Function to get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate overall score
  const overallScore = scores
    ? Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length)
    : 0;

  if (loading) {
    return (
      <div className="p-6 border rounded-lg shadow-sm bg-white">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg shadow-sm bg-white">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="p-6 border rounded-lg shadow-sm bg-white">
        <p>No scores available yet. Complete the interview to generate scores.</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Candidate Assessment</h2>
        <div className="flex items-center">
          <div className="text-3xl font-bold mr-2">{overallScore}</div>
          <div className="text-sm text-gray-500">Overall Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scores.map((item) => (
          <div key={item.category} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-800 capitalize">
                {item.category.replace(/_/g, ' ')}
              </h3>
              <div className={`text-white text-sm font-medium px-2 py-1 rounded-full ${getScoreColor(item.score)}`}>
                {item.score}/100
              </div>
            </div>
            <p className="text-sm text-gray-600">{item.notes}</p>
            <div className="mt-2 text-xs text-gray-400 flex justify-between">
              <span>Scored by: {item.created_by === 'ai' ? 'AI' : 'Human'}</span>
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}