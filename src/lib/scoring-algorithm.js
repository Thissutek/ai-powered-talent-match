/**
 * Scoring Algorithm
 * 
 * This module provides functions to calculate scores based on various criteria.
 * It can be used for rating systems, game scoring, performance evaluations, etc.
 */

// Base score calculation
/**
 * Calculate a base score by ensuring the raw score is within bounds
 * @param {number} rawScore - The initial score value
 * @param {number} maxPossible - The maximum possible score (defaults to 100)
 * @returns {number} - A score clamped between 0 and maxPossible
 */
const calculateBaseScore = (rawScore, maxPossible = 100) => {
  return Math.min(Math.max(0, rawScore), maxPossible);
};

/**
 * Calculate weighted score based on multiple factors
 * @param {Object} factors - Object containing factor names and their values
 * @param {Object} weights - Object containing factor names and their weights
 * @returns {number} - The calculated weighted score
 * 
 * This function multiplies each factor by its corresponding weight,
 * sums these products, and then divides by the sum of weights to get
 * a weighted average. If no valid weights exist, it returns 0.
 */
const calculateWeightedScore = (factors, weights) => {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const factor in factors) {
    if (weights[factor]) {
      totalScore += factors[factor] * weights[factor];
      totalWeight += weights[factor];
    }
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
};

/**
 * Apply bonus points to a score
 * @param {number} score - The base score
 * @param {Array} bonuses - Array of bonus values to add
 * @returns {number} - Score with bonuses applied
 * 
 * This function adds all bonus values to the original score.
 */
const applyBonuses = (score, bonuses = []) => {
  return score + bonuses.reduce((sum, bonus) => sum + bonus, 0);
};

/**
 * Apply penalties to a score
 * @param {number} score - The base score
 * @param {Array} penalties - Array of penalty values to subtract
 * @returns {number} - Score with penalties applied
 * 
 * This function subtracts all penalty values from the original score,
 * ensuring the result never goes below zero.
 */
const applyPenalties = (score, penalties = []) => {
  return Math.max(0, score - penalties.reduce((sum, penalty) => sum + penalty, 0));
};

/**
 * Calculate final score with all modifiers
 * @param {Object} factors - Base factors for scoring
 * @param {Object} weights - Weights for each factor
 * @param {Array} bonuses - Bonus points to add
 * @param {Array} penalties - Penalty points to subtract
 * @param {number} maxScore - Maximum possible score
 * @returns {Object} - Object containing raw and normalized scores
 * 
 * This function combines all scoring mechanisms:
 * 1. First calculates a weighted score from factors and weights
 * 2. Applies any bonus points
 * 3. Applies any penalty points
 * 4. Returns an object with the raw score, normalized score (as percentage), and letter grade
 */
const calculateFinalScore = (factors, weights, bonuses = [], penalties = [], maxScore = 100) => {
  let score = calculateWeightedScore(factors, weights);
  score = applyBonuses(score, bonuses);
  score = applyPenalties(score, penalties);
  
  return {
    rawScore: score,
    normalizedScore: (score / maxScore) * 100,
    grade: getGradeFromScore(score, maxScore)
  };
};

/**
 * Convert a numeric score to a letter grade
 * @param {number} score - The numeric score
 * @param {number} maxScore - Maximum possible score
 * @returns {string} - Letter grade
 * 
 * This function converts a numeric score to a standard letter grade (A-F)
 * based on percentage thresholds:
 * - A: 90% and above
 * - B: 80-89%
 * - C: 70-79%
 * - D: 60-69%
 * - F: Below 60%
 */
const getGradeFromScore = (score, maxScore) => {
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

module.exports = {
  calculateBaseScore,
  calculateWeightedScore,
  applyBonuses,
  applyPenalties,
  calculateFinalScore,
  getGradeFromScore
};

