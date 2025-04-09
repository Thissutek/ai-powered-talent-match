// src/components/RecruitersInput.js
'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function RecruitersInput({ candidateId, onReviewSubmitted }) {
  const [content, setContent] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [skills, setSkills] = useState([{ name: '', proficiency: 3 }]);
  const [scores, setScores] = useState([
    { category: 'technical_skills', score: 0, notes: '' },
    { category: 'communication', score: 0, notes: '' },
    { category: 'culture_fit', score: 0, notes: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSkillChange = (index, field, value) => {
    const updatedSkills = [...skills];
    updatedSkills[index][field] = value;
    setSkills(updatedSkills);
  };

  const addSkill = () => {
    setSkills([...skills, { name: '', proficiency: 3 }]);
  };

  const removeSkill = (index) => {
    const updatedSkills = [...skills];
    updatedSkills.splice(index, 1);
    setSkills(updatedSkills);
  };

  const handleScoreChange = (index, field, value) => {
    const updatedScores = [...scores];
    updatedScores[index][field] = value;
    setScores(updatedScores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to submit a review');
      }

      // Get reviewer data
      const { data: reviewerData, error: reviewerError } = await supabase
        .from('human_reviewers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (reviewerError) {
        throw new Error('Reviewer profile not found');
      }

      // Submit review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          candidate_id: candidateId,
          reviewer_id: reviewerData.id,
          content,
          recommendation
        });

      if (reviewError) throw reviewError;

      // Submit skills assessments
      const validSkills = skills.filter(skill => skill.name.trim() !== '');
      
      for (const skill of validSkills) {
        // Check if skill exists
        let { data: skillData } = await supabase
          .from('skills')
          .select('id')
          .eq('name', skill.name.toLowerCase())
          .single();

        // Create skill if it doesn't exist
        if (!skillData) {
          const { data: newSkill, error: skillError } = await supabase
            .from('skills')
            .insert({ name: skill.name.toLowerCase() })
            .select('id')
            .single();

          if (skillError) continue;
          skillData = newSkill;
        }

        // Add or update skill for candidate
        const { error: skillAssocError } = await supabase
          .from('candidate_skills')
          .upsert({
            candidate_id: candidateId,
            skill_id: skillData.id,
            proficiency: skill.proficiency,
            source: 'human_review'
          }, {
            onConflict: 'candidate_id,skill_id'
          });

        if (skillAssocError) console.error('Error associating skill:', skillAssocError);
      }

      // Submit scores
      const validScores = scores.filter(score => score.score > 0);
      
      for (const score of validScores) {
        const { error: scoreError } = await supabase
          .from('scores')
          .insert({
            candidate_id: candidateId,
            category: score.category,
            score: score.score,
            notes: score.notes,
            created_by: 'human'
          });

        if (scoreError) console.error('Error adding score:', scoreError);
      }

      setSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted();
      
      // Reset form after successful submission
      setContent('');
      setRecommendation('');
      setSkills([{ name: '', proficiency: 3 }]);
      setScores([
        { category: 'technical_skills', score: 0, notes: '' },
        { category: 'communication', score: 0, notes: '' },
        { category: 'culture_fit', score: 0, notes: '' }
      ]);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Expert Review</h2>
      
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Review submitted successfully!
        </div>
      ) : null}
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      ) : null}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Review Notes
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Share your assessment of this candidate..."
            required
          ></textarea>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Recommendation
          </label>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select recommendation</option>
            <option value="strong_yes">Strong Yes</option>
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="no">No</option>
            <option value="strong_no">Strong No</option>
          </select>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">
              Skills Assessment
            </label>
            <button
              type="button"
              onClick={addSkill}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              + Add Skill
            </button>
          </div>
          
          {skills.map((skill, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                value={skill.name}
                onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Skill name"
              />
              <select
                value={skill.proficiency}
                onChange={(e) => handleSkillChange(index, 'proficiency', parseInt(e.target.value))}
                className="w-32 px-3 py-2 border rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Beginner</option>
                <option value={2}>Basic</option>
                <option value={3}>Intermediate</option>
                <option value={4}>Advanced</option>
                <option value={5}>Expert</option>
              </select>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Performance Scores
          </label>
          
          {scores.map((score, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {score.category.replace(/_/g, ' ')}
                </label>
                <span className="text-sm font-medium">
                  {score.score}/100
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={score.score}
                onChange={(e) => handleScoreChange(index, 'score', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="text"
                value={score.notes}
                onChange={(e) => handleScoreChange(index, 'notes', e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notes about this score"
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}