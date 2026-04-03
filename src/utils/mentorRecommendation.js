/**
 * Mentor Recommendation Engine
 * 
 * Deterministic scoring system for matching users with mentors based on:
 * - Tag matching
 * - Keyword matching in descriptions
 * - Domain alignment
 * - Call-type specific preferences
 * - Communication score
 * 
 * All scoring is explainable with detailed reasoning.
 */

/**
 * Scoring weights and constants
 */
const SCORING_CONFIG = {
  // Tag matching
  TAG_MATCH_WEIGHT: 2,

  // Domain matching
  DOMAIN_EXACT_MATCH_BOOST: 5,
  DOMAIN_MISMATCH_PENALTY: -3,

  // Communication score
  COMMUNICATION_HIGH_THRESHOLD: 4.0,
  COMMUNICATION_HIGH_BOOST: 2,
  COMMUNICATION_LOW_PENALTY: -1,

  // Call-type specific boosts
  CALL_TYPE_BOOSTS: {
    RESUME_REVAMP: {
      big_tech: 3,
      startup: 1,
      mid_size: 1,
    },
    JOB_MARKET_GUIDANCE: {
      high_communication: 3,
      big_tech: 1,
      mid_size: 1,
    },
    MOCK_INTERVIEW: {
      domain_match: 4,
      big_tech: 1,
    },
    GENERAL_MENTORING: {
      domain_match: 1,
      high_communication: 1,
    },
  },

  // Keyword matching
  KEYWORD_BASE_WEIGHT: 0.5,
  KEYWORD_DOMAIN_MULTIPLIER: 2,

  // Scoring thresholds
  MIN_VIABLE_SCORE: 0,
  MATCH_PERCENTAGE_CAP: 100,
};

/**
 * Normalize tags for comparison (lowercase, trim)
 * @param {string} tag
 * @returns {string}
 */
function normalizeTag(tag) {
  return String(tag).toLowerCase().trim();
}

/**
 * Extract keywords from description (remove common words)
 * @param {string} description
 * @returns {string[]}
 */
function extractKeywords(description) {
  if (!description) return [];

  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'be', 'have', 'has', 'do',
    'does', 'did', 'will', 'can', 'could', 'should', 'would', 'am', 'are',
    'was', 'were', 'been', 'being', 'me', 'you', 'he', 'she', 'it', 'we',
    'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this',
    'that', 'these', 'those', 'i', 'about', 'help', 'experience', 'years',
  ]);

  return description
    .toLowerCase()
    .split(/[\s,;:().!?-]+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}

/**
 * Calculate tag match score
 * @param {string[]} userTags - User's tags
 * @param {string[]} mentorTags - Mentor's tags
 * @returns {object} { score, matches, details }
 */
function scoreTagMatches(userTags = [], mentorTags = []) {
  if (!userTags.length || !mentorTags.length) {
    return { score: 0, matches: [], details: 'No tags provided' };
  }

  const normalizedUserTags = new Set(userTags.map(normalizeTag));
  const normalizedMentorTags = new Set(mentorTags.map(normalizeTag));

  const matches = Array.from(normalizedUserTags).filter(tag =>
    normalizedMentorTags.has(tag)
  );

  const score = matches.length * SCORING_CONFIG.TAG_MATCH_WEIGHT;
  const details = `${matches.length} tag match${matches.length !== 1 ? 'es' : ''}: ${matches.join(', ')}`;

  return { score, matches, details };
}

/**
 * Calculate keyword match score
 * @param {string} userDescription - User's description
 * @param {string} mentorDescription - Mentor's description
 * @param {string} domain - User's domain (for multiplier)
 * @returns {object} { score, matches, details }
 */
function scoreKeywordMatches(userDescription = '', mentorDescription = '', domain = '') {
  const userKeywords = extractKeywords(userDescription);
  const mentorKeywords = new Set(extractKeywords(mentorDescription));

  if (!userKeywords.length) {
    return { score: 0, matches: [], details: 'No keywords extracted from description' };
  }

  const matches = userKeywords.filter(keyword => mentorKeywords.has(keyword));

  if (!matches.length) {
    return { score: 0, matches: [], details: 'No matching keywords found' };
  }

  // Apply domain multiplier for domain-relevant keywords
  const domainKeywords = domain ? extractKeywords(domain) : [];
  const domainMatchCount = matches.filter(kw => domainKeywords.includes(kw)).length;

  const baseScore = matches.length * SCORING_CONFIG.KEYWORD_BASE_WEIGHT;
  const domainBonus = domainMatchCount * SCORING_CONFIG.KEYWORD_BASE_WEIGHT * SCORING_CONFIG.KEYWORD_DOMAIN_MULTIPLIER;
  const score = baseScore + domainBonus;

  const details = `${matches.length} keyword match${matches.length !== 1 ? 'es' : ''}${domainMatchCount > 0 ? ` (${domainMatchCount} domain-related)` : ''}`;

  return { score, matches, details };
}

/**
 * Calculate domain match score
 * @param {string} userDomain - User's domain
 * @param {string} mentorDomain - Mentor's domain
 * @returns {object} { score, match, details }
 */
function scoreDomainMatch(userDomain = '', mentorDomain = '') {
  if (!userDomain || !mentorDomain) {
    return { score: 0, match: false, details: 'Domain information missing' };
  }

  const normalizedUserDomain = normalizeTag(userDomain);
  const normalizedMentorDomain = normalizeTag(mentorDomain);

  const isExactMatch = normalizedUserDomain === normalizedMentorDomain;

  if (isExactMatch) {
    return {
      score: SCORING_CONFIG.DOMAIN_EXACT_MATCH_BOOST,
      match: true,
      details: `Exact domain match: ${userDomain}`,
    };
  }

  // Check for related domains (e.g., "frontend" matches "web_development")
  const userParts = normalizedUserDomain.split(/[-_/\s]/);
  const mentorParts = normalizedMentorDomain.split(/[-_/\s]/);

  const partialMatch = userParts.some(part =>
    part.length > 2 && mentorParts.some(mPart => mPart.includes(part) || part.includes(mPart))
  );

  if (partialMatch) {
    return {
      score: SCORING_CONFIG.DOMAIN_EXACT_MATCH_BOOST * 0.5,
      match: 'partial',
      details: `Related domains: ${userDomain} ↔ ${mentorDomain}`,
    };
  }

  return {
    score: SCORING_CONFIG.DOMAIN_MISMATCH_PENALTY,
    match: false,
    details: `Domain mismatch: ${userDomain} vs ${mentorDomain}`,
  };
}

/**
 * Calculate communication score boost
 * @param {number} communicationScore - Mentor's communication score (0-5)
 * @returns {object} { score, level, details }
 */
function scoreCommunication(communicationScore = 0) {
  if (communicationScore >= SCORING_CONFIG.COMMUNICATION_HIGH_THRESHOLD) {
    return {
      score: SCORING_CONFIG.COMMUNICATION_HIGH_BOOST,
      level: 'high',
      details: `High communication score: ${communicationScore.toFixed(1)}/5`,
    };
  }

  if (communicationScore < 2) {
    return {
      score: SCORING_CONFIG.COMMUNICATION_LOW_PENALTY,
      level: 'low',
      details: `Low communication score: ${communicationScore.toFixed(1)}/5`,
    };
  }

  return {
    score: 0,
    level: 'moderate',
    details: `Moderate communication score: ${communicationScore.toFixed(1)}/5`,
  };
}

/**
 * Get call-type specific boosts
 * @param {string} callType - Type of call (resume_revamp, job_market_guidance, mock_interview, general_mentoring)
 * @param {string} companyType - Mentor's company type (big_tech, startup, mid_size, etc.)
 * @param {number} communicationScore - Mentor's communication score
 * @returns {object} { score, boosts, details }
 */
function scoreCallTypeSpecifics(callType = 'GENERAL_MENTORING', companyType = '', communicationScore = 0) {
  const callTypeBoosts = SCORING_CONFIG.CALL_TYPE_BOOSTS[callType];

  if (!callTypeBoosts) {
    return { score: 0, boosts: [], details: `Unknown call type: ${callType}` };
  }

  let score = 0;
  const boosts = [];

  // Company type specific boost
  if (companyType && callTypeBoosts[companyType.toLowerCase()]) {
    const boost = callTypeBoosts[companyType.toLowerCase()];
    score += boost;
    boosts.push(`${companyType} company: +${boost}`);
  }

  // High communication boost for job market guidance
  if (callType === 'JOB_MARKET_GUIDANCE' &&
      communicationScore >= SCORING_CONFIG.COMMUNICATION_HIGH_THRESHOLD &&
      callTypeBoosts.high_communication) {
    const boost = callTypeBoosts.high_communication;
    score += boost;
    boosts.push(`High communication: +${boost}`);
  }

  // Domain match boost for mock interview
  if (callType === 'MOCK_INTERVIEW' && callTypeBoosts.domain_match) {
    // This will be applied in main scoring if domain matches
    boosts.push(`Domain match boost available: +${callTypeBoosts.domain_match}`);
  }

  const details = boosts.length > 0
    ? `${callType}: ${boosts.join(', ')}`
    : `No specific boosts for ${callType}`;

  return { score, boosts, details };
}

/**
 * Calculate overall recommendation score for a mentor
 * @param {object} user - User profile { tags, domain, description }
 * @param {object} mentor - Mentor profile { id, name, tags, domain, description, company_type, communication_score }
 * @param {string} callType - Type of call
 * @returns {object} Scoring breakdown with total score
 */
function calculateMentorScore(user, mentor, callType = 'GENERAL_MENTORING') {
  if (!user || !mentor) {
    throw new Error('User and mentor profiles are required');
  }

  const scoring = {
    tagMatches: scoreTagMatches(user.tags, mentor.tags),
    keywordMatches: scoreKeywordMatches(user.description, mentor.description, user.domain),
    domainMatch: scoreDomainMatch(user.domain, mentor.domain),
    communication: scoreCommunication(mentor.communicationScore || mentor.communication_score),
    callTypeSpecifics: scoreCallTypeSpecifics(callType, mentor.companyType || mentor.company_type, mentor.communicationScore || mentor.communication_score),
  };

  // Apply additional domain match boost for mock_interview
  if (callType === 'MOCK_INTERVIEW' && scoring.domainMatch.match === true) {
    const domainMatchBoost = SCORING_CONFIG.CALL_TYPE_BOOSTS.MOCK_INTERVIEW.domain_match;
    scoring.domainMatch.additionalBoost = domainMatchBoost;
  }

  const totalScore = [
    scoring.tagMatches.score,
    scoring.keywordMatches.score,
    scoring.domainMatch.score,
    scoring.communication.score,
    scoring.callTypeSpecifics.score,
    scoring.domainMatch.additionalBoost || 0,
  ].reduce((a, b) => a + b, 0);

  return {
    totalScore: Math.max(SCORING_CONFIG.MIN_VIABLE_SCORE, totalScore),
    scoring,
  };
}

/**
 * Build reasoning explanation for recommendation
 * @param {object} scoreData - Result from calculateMentorScore
 * @param {object} mentor - Mentor profile
 * @returns {string[]} Array of reasoning explanations
 */
function buildReasoningExplanation(scoreData, mentor) {
  const reasons = [];
  const { scoring } = scoreData;

  // Tag matches
  if (scoring.tagMatches.score > 0) {
    reasons.push(`✓ ${scoring.tagMatches.details}`);
  }

  // Keyword matches
  if (scoring.keywordMatches.score > 0) {
    reasons.push(`✓ ${scoring.keywordMatches.details}`);
  }

  // Domain match
  if (scoring.domainMatch.score > 0) {
    reasons.push(`✓ ${scoring.domainMatch.details}`);
  } else if (scoring.domainMatch.score < 0) {
    reasons.push(`✗ ${scoring.domainMatch.details}`);
  }

  // Communication
  if (scoring.communication.score > 0) {
    reasons.push(`✓ ${scoring.communication.details}`);
  } else if (scoring.communication.score < 0) {
    reasons.push(`✗ ${scoring.communication.details}`);
  }

  // Call-type specific
  if (scoring.callTypeSpecifics.score > 0) {
    reasons.push(`✓ ${scoring.callTypeSpecifics.details}`);
  }

  // Additional domain boost for mock interview
  if (scoring.domainMatch.additionalBoost) {
    reasons.push(`✓ Mock interview domain match boost: +${scoring.domainMatch.additionalBoost}`);
  }

  return reasons;
}

/**
 * Calculate match percentage (0-100)
 * @param {number} score - Total score
 * @param {number} maxPossibleScore - Maximum possible score
 * @returns {number} Match percentage
 */
function calculateMatchPercentage(score, maxPossibleScore) {
  if (maxPossibleScore <= 0) return 0;
  const percentage = (score / maxPossibleScore) * 100;
  return Math.min(percentage, SCORING_CONFIG.MATCH_PERCENTAGE_CAP);
}

/**
 * Recommend mentors for a user
 * @param {object} user - User profile { tags, domain, description }
 * @param {object[]} mentors - Array of mentor profiles
 * @param {string} callType - Type of call (resume_revamp, job_market_guidance, mock_interview, general_mentoring)
 * @param {number} limit - Maximum number of recommendations
 * @returns {object[]} Sorted list of recommendations
 */
export function recommendMentors(user, mentors, callType = 'GENERAL_MENTORING', limit = 10) {
  if (!user || !mentors || !Array.isArray(mentors)) {
    throw new Error('User profile and mentors array are required');
  }

  if (mentors.length === 0) {
    return [];
  }

  // Calculate scores for all mentors
  const scoredMentors = mentors.map(mentor => {
    try {
      const scoreData = calculateMentorScore(user, mentor, callType);
      const reasoning = buildReasoningExplanation(scoreData, mentor);

      return {
        mentor,
        score: scoreData.totalScore,
        reasoning,
        scoreBreakdown: {
          tagMatches: scoreData.scoring.tagMatches.score,
          keywordMatches: scoreData.scoring.keywordMatches.score,
          domainMatch: scoreData.scoring.domainMatch.score,
          communication: scoreData.scoring.communication.score,
          callTypeSpecifics: scoreData.scoring.callTypeSpecifics.score,
          additionalBoost: scoreData.scoring.domainMatch.additionalBoost || 0,
        },
      };
    } catch (error) {
      console.warn(`Error scoring mentor ${mentor.id}: ${error.message}`);
      return null;
    }
  }).filter(Boolean);

  // Calculate maximum possible score for percentage
  const maxPossibleScore = [
    SCORING_CONFIG.TAG_MATCH_WEIGHT * 10, // Assume max 10 matching tags
    SCORING_CONFIG.KEYWORD_BASE_WEIGHT * 10 * (1 + SCORING_CONFIG.KEYWORD_DOMAIN_MULTIPLIER), // Keywords
    SCORING_CONFIG.DOMAIN_EXACT_MATCH_BOOST, // Domain match
    SCORING_CONFIG.COMMUNICATION_HIGH_BOOST, // Communication
    Math.max(...Object.values(SCORING_CONFIG.CALL_TYPE_BOOSTS[callType] || {})), // Call type boost
    SCORING_CONFIG.CALL_TYPE_BOOSTS[callType]?.domain_match || 0, // Additional domain boost
  ].reduce((a, b) => a + b, 0);

  // Add match percentage and sort
  const recommendations = scoredMentors
    .map(mentor => ({
      ...mentor,
      match_percentage: calculateMatchPercentage(mentor.score, maxPossibleScore),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

/**
 * Get detailed scoring explanation for a mentor
 * @param {object} user - User profile
 * @param {object} mentor - Mentor profile
 * @param {string} callType - Type of call
 * @returns {object} Detailed scoring breakdown
 */
export function getMentorScoringDetails(user, mentor, callType = 'GENERAL_MENTORING') {
  const scoreData = calculateMentorScore(user, mentor, callType);
  const reasoning = buildReasoningExplanation(scoreData, mentor);

  return {
    mentor: {
      id: mentor.id,
      name: mentor.name,
    },
    callType,
    totalScore: scoreData.totalScore,
    reasoning,
    detailedBreakdown: {
      tagMatches: scoreData.scoring.tagMatches,
      keywordMatches: scoreData.scoring.keywordMatches,
      domainMatch: scoreData.scoring.domainMatch,
      communication: scoreData.scoring.communication,
      callTypeSpecifics: scoreData.scoring.callTypeSpecifics,
    },
  };
}

/**
 * Get available call types
 * @returns {string[]} List of supported call types
 */
export function getAvailableCallTypes() {
  return Object.keys(SCORING_CONFIG.CALL_TYPE_BOOSTS);
}

/**
 * Export scoring configuration for inspection
 * @returns {object} Scoring weights and thresholds
 */
export function getScoringConfig() {
  return { ...SCORING_CONFIG };
}

export default {
  recommendMentors,
  getMentorScoringDetails,
  getAvailableCallTypes,
  getScoringConfig,
};
