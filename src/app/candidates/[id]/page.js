// src/app/candidates/[id]/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import ResumeUploader from '@/components/ResumeUploader';
import CandidateChat from '@/components/CandidateChat';
import ScoreCard from '@/components/ScoreCard';
import RecruitersInput from '@/components/RecruitersInput';

export default function CandidateDetail() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/auth/login');
      } else {
        fetchCandidateData();
      }
    });
  }, [params.id, router]);

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      
      // Get candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (candidateError) throw candidateError;
      
      setCandidate(candidateData);
      
      // Get resume data
      const { data: resumeFiles, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('candidate_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!resumeError && resumeFiles.length > 0) {
        setResumeData(resumeFiles[0]);
      }
      
      // Get skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('candidate_skills')
        .select(`
          skill_id,
          proficiency,
          source,
          skills (
            name
          )
        `)
        .eq('candidate_id', params.id);
      
      if (!skillsError) {
        setSkills(skillsData.map(item => ({
          id: item.skill_id,
          name: item.skills.name,
          proficiency: item.proficiency,
          source: item.source
        })));
      }
      
      // Get reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          content,
          recommendation,
          created_at,
          human_reviewers (
            full_name
          )
        `)
        .eq('candidate_id', params.id)
        .order('created_at', { ascending: false });
      
      if (!reviewsError) {
        setReviews(reviewsData);
      }
      
    } catch (err) {
      console.error('Error fetching candidate data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUploaded = (data) => {
    setResumeData(data);
    fetchCandidateData(); // Refresh all data
  };

  const handleReviewSubmitted = () => {
    fetchCandidateData(); // Refresh all data
  };

  // Get recommendation color
  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'strong_yes': return 'bg-green-100 text-green-800';
      case 'yes': return 'bg-blue-100 text-blue-800';
      case 'maybe': return 'bg-yellow-100 text-yellow-800';
      case 'no': return 'bg-orange-100 text-orange-800';
      case 'strong_no': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format recommendation text
  const formatRecommendation = (recommendation) => {
    switch (recommendation) {
      case 'strong_yes': return 'Strong Yes';
      case 'yes': return 'Yes';
      case 'maybe': return 'Maybe';
      case 'no': return 'No';
      case 'strong_no': return 'Strong No';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Candidate</h2>
            <p className="text-gray-600 mb-4">{error || 'Candidate not found'}</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-blue-700">TalentMatchAI</div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Candidate Detail</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="font-medium text-blue-800 text-xl">
                    {candidate.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{candidate.full_name}</h2>
                  <div className="text-gray-600">{candidate.email}</div>
                  {candidate.phone && <div className="text-gray-600">{candidate.phone}</div>}
                  {candidate.location && <div className="text-gray-600">{candidate.location}</div>}
                </div>
              </div>
              <div>
                <Link
                  href={`/candidates/${candidate.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Candidate
                </Link>
              </div>
            </div>
            
            <div className="border-b mb-6">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('interview')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'interview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AI Interview
                </button>
                <button
                  onClick={() => setActiveTab('scores')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'scores'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Scores
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'reviews'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Expert Reviews
                </button>
              </nav>
            </div>
            
            {activeTab === 'profile' && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Candidate Profile</h3>
                    
                    {!resumeData ? (
                      <div className="mb-8">
                        <h4 className="text-md font-medium mb-2">Resume Upload</h4>
                        <ResumeUploader 
                          candidateId={candidate.id} 
                          onSuccess={handleResumeUploaded} 
                        />
                      </div>
                    ) : (
                      <div className="mb-8">
                        <h4 className="text-md font-medium mb-2">Resume</h4>
                        <div className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center">
                            <svg className="h-8 w-8 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <div className="font-medium">{resumeData.file_name}</div>
                              <div className="text-sm text-gray-500">
                                Uploaded on {new Date(resumeData.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => setActiveTab('interview')}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Continue to Interview
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-md font-medium mb-2">Skills</h4>
                      {skills.length === 0 ? (
                        <p className="text-gray-500">No skills data available yet.</p>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proficiency</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {skills.map((skill) => (
                                <tr key={skill.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                    {skill.name}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                                        <div 
                                          className="h-2 bg-blue-600 rounded-full" 
                                          style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span>{skill.proficiency}/5</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                                    {skill.source.replace('_', ' ')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Expert Evaluation</h3>
                    <RecruitersInput 
                      candidateId={candidate.id}
                      onReviewSubmitted={handleReviewSubmitted}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'interview' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">AI Interview</h3>
                <CandidateChat 
                  candidateId={candidate.id}
                  resumeData={resumeData}
                />
              </div>
            )}
            
            {activeTab === 'scores' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Candidate Scores</h3>
                <ScoreCard candidateId={candidate.id} />
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Expert Reviews</h3>
                
                {reviews.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-gray-50">
                    <p className="text-gray-500 mb-4">No expert reviews yet.</p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Add Review
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-medium">{review.human_reviewers?.full_name || 'Recruiter'}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRecommendationColor(review.recommendation)}`}>
                            {formatRecommendation(review.recommendation)}
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line">{review.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}