import React, { useState, useMemo } from 'react';
import { recommendMentors, getAvailableCallTypes, getMentorScoringDetails } from '../utils/mentorRecommendation.js';

/**
 * MentorRecommendation Component
 * 
 * Displays mentor recommendations based on user profile and call type
 * Shows scoring breakdown and detailed reasoning
 */
export default function MentorRecommendation({
  user = null,
  mentors = [],
  onMentorSelect = null,
  maxRecommendations = 5,
  showScoringDetails = true,
}) {
  const [selectedCallType, setSelectedCallType] = useState('RESUME_REVAMP');
  const [expandedMentorId, setExpandedMentorId] = useState(null);
  const [showScoringBreakdown, setShowScoringBreakdown] = useState(null);

  const availableCallTypes = getAvailableCallTypes();

  // Calculate recommendations
  const recommendations = useMemo(() => {
    if (!user || mentors.length === 0) {
      return [];
    }

    try {
      return recommendMentors(user, mentors, selectedCallType, maxRecommendations);
    } catch (error) {
      console.error('Error calculating recommendations:', error);
      return [];
    }
  }, [user, mentors, selectedCallType, maxRecommendations]);

  const handleMentorSelect = (mentor) => {
    if (onMentorSelect) {
      onMentorSelect(mentor);
    }
  };

  const handleExpand = (mentorId) => {
    setExpandedMentorId(expandedMentorId === mentorId ? null : mentorId);
  };

  const handleViewScoring = (mentor) => {
    if (!user) return;
    const scoring = getMentorScoringDetails(user, mentor, selectedCallType);
    setShowScoringBreakdown(scoring);
  };

  if (!user) {
    return (
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-6 text-center">
        <p className="text-slate-400">User profile not available. Unable to generate recommendations.</p>
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-6 text-center">
        <p className="text-slate-400">No mentors available for recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
        <h2 className="text-xl font-semibold text-white mb-4">🎓 Mentor Recommendations</h2>

        {/* Call Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-400 mb-2">Call Type</label>
          <div className="flex flex-wrap gap-2">
            {availableCallTypes.map(callType => (
              <button
                key={callType}
                onClick={() => setSelectedCallType(callType)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedCallType === callType
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {callType.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="text-sm text-slate-300 bg-slate-800 rounded p-3">
          <p><strong>Tags:</strong> {(user.tags || []).join(', ') || 'None specified'}</p>
          <p><strong>Domain:</strong> {user.domain || 'Not specified'}</p>
          {user.description && <p><strong>Goals:</strong> {user.description.substring(0, 100)}...</p>}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.length > 0 ? (
          recommendations.map((mentor, index) => (
            <div
              key={mentor.id}
              className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden hover:border-blue-600 transition-colors"
            >
              {/* Main Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-blue-400">#{index + 1}</span>
                      <h3 className="text-lg font-semibold text-white">{mentor.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">
                        {mentor.companyType}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">
                        {mentor.domain}
                      </span>
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-green-400">
                      {mentor.match_percentage?.toFixed(0) || 0}%
                    </div>
                    <div className="text-xs text-slate-400">Match</div>
                    <div className="text-xs text-slate-500 mt-1">Score: {mentor.score.toFixed(1)}</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-3 flex flex-wrap gap-1">
                  {mentor.tags.slice(0, 5).map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                  {mentor.tags.length > 5 && (
                    <span className="text-xs px-2 py-1 text-slate-500">
                      +{mentor.tags.length - 5} more
                    </span>
                  )}
                </div>

                {/* Communication Score */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-slate-400">Communication:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i <= Math.round(mentor.communicationScore)
                            ? 'bg-yellow-400'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-300 ml-2">{(mentor.communicationScore || 0).toFixed(1)}/5</span>
                </div>

                {/* Quick Reasons */}
                <div className="text-sm text-slate-300 mb-3">
                  <p className="font-medium mb-1">Why recommended:</p>
                  <ul className="space-y-1">
                    {mentor.reasoning.slice(0, 3).map((reason, i) => (
                      <li key={i} className="text-xs text-slate-400">• {reason}</li>
                    ))}
                  </ul>
                </div>

                {/* Expand/Collapse Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExpand(mentor.id)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    {expandedMentorId === mentor.id ? '▼ Details' : '▶ Details'}
                  </button>

                  {showScoringDetails && (
                    <button
                      onClick={() => handleViewScoring(mentor)}
                      className="flex-1 px-3 py-1.5 text-sm font-medium rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      📊 Scoring
                    </button>
                  )}

                  <button
                    onClick={() => handleMentorSelect(mentor)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Select
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedMentorId === mentor.id && (
                <div className="border-t border-slate-800 bg-slate-800 bg-opacity-50 p-4">
                  <div className="space-y-3">
                    {/* All Tags */}
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-1">All Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {mentor.tags.map(tag => (
                          <span key={tag} className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-2">Score Breakdown:</p>
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span>Tag Matches:</span>
                          <span className="font-mono">{mentor.scoreBreakdown.tagMatches.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Keyword Matches:</span>
                          <span className="font-mono">{mentor.scoreBreakdown.keywordMatches.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Domain Match:</span>
                          <span className="font-mono">{mentor.scoreBreakdown.domainMatch.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Communication:</span>
                          <span className="font-mono">{mentor.scoreBreakdown.communication.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Call Type Boost:</span>
                          <span className="font-mono">{mentor.scoreBreakdown.callTypeSpecifics.toFixed(1)}</span>
                        </div>
                        {mentor.scoreBreakdown.additionalBoost > 0 && (
                          <div className="flex justify-between">
                            <span>Additional Boost:</span>
                            <span className="font-mono">{mentor.scoreBreakdown.additionalBoost.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-600 pt-1 mt-1 flex justify-between font-medium">
                          <span>Total:</span>
                          <span className="text-green-400 font-mono">{mentor.score.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* All Reasons */}
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-1">Detailed Reasoning:</p>
                      <ul className="space-y-1">
                        {mentor.reasoning.map((reason, i) => (
                          <li key={i} className="text-xs text-slate-400">• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-6 text-center">
            <p className="text-slate-400">No recommendations available. Try adjusting your profile.</p>
          </div>
        )}
      </div>

      {/* Scoring Details Modal */}
      {showScoringBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {showScoringBreakdown.mentor.name}
                </h3>
                <p className="text-sm text-slate-400">
                  Call Type: {showScoringBreakdown.callType.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={() => setShowScoringBreakdown(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Overall Score */}
              <div className="text-center py-4 bg-slate-800 rounded">
                <div className="text-4xl font-bold text-green-400">
                  {showScoringBreakdown.totalScore.toFixed(1)}
                </div>
                <p className="text-sm text-slate-400">Total Score</p>
              </div>

              {/* Detailed Breakdown */}
              <div>
                <h4 className="font-semibold text-white mb-3">Scoring Components:</h4>
                <div className="space-y-2">
                  {Object.entries(showScoringBreakdown.detailedBreakdown).map(([key, value]) => (
                    <div key={key} className="bg-slate-800 rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-slate-400">{value.details}</p>
                        </div>
                        <div className="text-lg font-bold text-green-400">
                          {typeof value.score === 'number' ? value.score.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="font-semibold text-white mb-2">Reasoning:</h4>
                <ul className="space-y-1">
                  {showScoringBreakdown.reasoning.map((reason, i) => (
                    <li key={i} className="text-sm text-slate-300">• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
