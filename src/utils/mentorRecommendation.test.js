/**
 * Mentor Recommendation Engine - Test Suite & Examples
 * 
 * Demonstrates scoring logic, edge cases, and call-type specific recommendations
 */

import {
  recommendMentors,
  getMentorScoringDetails,
  getAvailableCallTypes,
  getScoringConfig,
} from './mentorRecommendation.js';

/**
 * Example user profiles
 */
export const exampleUsers = {
  frontend_dev: {
    tags: ['react', 'javascript', 'typescript', 'css'],
    domain: 'Frontend Development',
    description: 'I am a frontend developer with 2 years of experience in React and TypeScript. I want to improve my system design skills and learn about scaling web applications.',
  },
  junior_full_stack: {
    tags: ['javascript', 'node.js', 'mongodb', 'react', 'aws'],
    domain: 'Full Stack Development',
    description: 'Junior full stack developer looking to transition from startup to big tech. Need guidance on interview preparation and coding best practices.',
  },
  career_changer: {
    tags: ['python', 'data_analysis', 'sql'],
    domain: 'Data Science',
    description: 'Career changer transitioning from finance to data science. Looking for guidance on data science job market and how to position myself.',
  },
  mock_interview_prep: {
    tags: ['system_design', 'algorithms', 'interview_prep', 'backend'],
    domain: 'Backend Engineering',
    description: 'Preparing for technical interviews at FAANG companies. Need mock interviews and detailed feedback on system design solutions.',
  },
};

/**
 * Example mentor profiles
 */
export const exampleMentors = [
  {
    id: 'mentor-001',
    name: 'Sarah Chen',
    tags: ['react', 'typescript', 'frontend', 'javascript', 'performance'],
    domain: 'Frontend Development',
    company_type: 'big_tech',
    communication_score: 4.8,
    description: 'Senior frontend engineer at Google with 8 years of React experience. Passionate about teaching and helping junior developers grow.',
  },
  {
    id: 'mentor-002',
    name: 'Raj Patel',
    tags: ['system_design', 'backend', 'node.js', 'microservices', 'aws'],
    domain: 'Backend Engineering',
    company_type: 'big_tech',
    communication_score: 4.5,
    description: 'Staff engineer at Amazon focused on backend systems and distributed computing. 10 years experience in scaling systems.',
  },
  {
    id: 'mentor-003',
    name: 'Emily Rodriguez',
    tags: ['career_transition', 'interviews', 'communication', 'startup'],
    domain: 'Career Development',
    company_type: 'startup',
    communication_score: 4.9,
    description: 'Career coach and startup founder with extensive interview experience. Helps career changers and job seekers navigate the market.',
  },
  {
    id: 'mentor-004',
    name: 'Michael Zhang',
    tags: ['data_science', 'python', 'machine_learning', 'sql'],
    domain: 'Data Science',
    company_type: 'big_tech',
    communication_score: 3.8,
    description: 'Machine learning engineer at Meta. 6 years in data science and analytics. Focused on technical depth.',
  },
  {
    id: 'mentor-005',
    name: 'Jessica Park',
    tags: ['full_stack', 'javascript', 'react', 'node.js', 'devops'],
    domain: 'Full Stack Development',
    company_type: 'mid_size',
    communication_score: 4.2,
    description: 'Full stack developer at mid-size tech company. Good balance of technical skills and mentoring experience.',
  },
  {
    id: 'mentor-006',
    name: 'David Thompson',
    tags: ['algorithms', 'system_design', 'interview_prep', 'leetcode'],
    domain: 'Backend Engineering',
    company_type: 'big_tech',
    communication_score: 4.6,
    description: 'Google engineer specializing in mock interviews and algorithm training. Helped 100+ candidates pass FAANG interviews.',
  },
  {
    id: 'mentor-007',
    name: 'Lisa Wong',
    tags: ['startup', 'full_stack', 'growth', 'marketing'],
    domain: 'Startup Engineering',
    company_type: 'startup',
    communication_score: 4.1,
    description: 'Startup CTO with experience scaling from 5 to 50 engineers. Mentor for startup founders and early employees.',
  },
  {
    id: 'mentor-008',
    name: 'Ahmed Hassan',
    tags: ['resume', 'interviews', 'salary_negotiation', 'job_market'],
    domain: 'Career Guidance',
    company_type: 'big_tech',
    communication_score: 4.7,
    description: 'HR consultant and career coach. Specializes in resume reviews and job market guidance for tech professionals.',
  },
];

/**
 * Test scenario: Frontend dev looking for resume review
 */
export function testResumeRevampRecommendation() {
  const user = exampleUsers.frontend_dev;
  const recommendations = recommendMentors(
    user,
    exampleMentors,
    'resume_revamp',
    5
  );

  return {
    scenario: 'Frontend dev looking for resume review',
    user,
    callType: 'resume_revamp',
    recommendations,
  };
}

/**
 * Test scenario: Junior full stack dev seeking job market guidance
 */
export function testJobMarketGuidanceRecommendation() {
  const user = exampleUsers.junior_full_stack;
  const recommendations = recommendMentors(
    user,
    exampleMentors,
    'job_market_guidance',
    5
  );

  return {
    scenario: 'Junior full stack dev seeking job market guidance',
    user,
    callType: 'job_market_guidance',
    recommendations,
  };
}

/**
 * Test scenario: Backend engineer preparing for mock interviews
 */
export function testMockInterviewRecommendation() {
  const user = exampleUsers.mock_interview_prep;
  const recommendations = recommendMentors(
    user,
    exampleMentors,
    'mock_interview',
    5
  );

  return {
    scenario: 'Backend engineer preparing for mock interviews',
    user,
    callType: 'mock_interview',
    recommendations,
  };
}

/**
 * Test scenario: Career changer with general mentoring
 */
export function testGeneralMentoringRecommendation() {
  const user = exampleUsers.career_changer;
  const recommendations = recommendMentors(
    user,
    exampleMentors,
    'general_mentoring',
    5
  );

  return {
    scenario: 'Career changer with general mentoring',
    user,
    callType: 'general_mentoring',
    recommendations,
  };
}

/**
 * Run all test scenarios
 */
export function runAllTests() {
  return {
    resumeRevamp: testResumeRevampRecommendation(),
    jobMarketGuidance: testJobMarketGuidanceRecommendation(),
    mockInterview: testMockInterviewRecommendation(),
    generalMentoring: testGeneralMentoringRecommendation(),
  };
}

/**
 * Format recommendation results for display
 */
export function formatRecommendations(testResult) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${testResult.scenario}`);
  console.log(`Call Type: ${testResult.callType}`);
  console.log('='.repeat(80));

  console.log('\n👤 User Profile:');
  console.log(`   Tags: ${testResult.user.tags.join(', ')}`);
  console.log(`   Domain: ${testResult.user.domain}`);
  console.log(`   Description: ${testResult.user.description}`);

  console.log('\n🎯 Top Recommendations:');
  testResult.recommendations.forEach((mentor, index) => {
    console.log(`\n${index + 1}. ${mentor.name} (ID: ${mentor.id})`);
    console.log(`   Score: ${mentor.score.toFixed(1)} | Match: ${mentor.match_percentage.toFixed(1)}%`);
    console.log(`   Company: ${mentor.company_type} | Communication: ${mentor.communication_score.toFixed(1)}/5`);
    console.log(`   Tags: ${mentor.tags.join(', ')}`);
    console.log(`   Domain: ${mentor.domain}`);
    console.log('   Reasoning:');
    mentor.reasoning.forEach(reason => {
      console.log(`     ${reason}`);
    });
    console.log(`   Score Breakdown: Tags=${mentor.scoreBreakdown.tagMatches}, Keywords=${mentor.scoreBreakdown.keywordMatches.toFixed(1)}, Domain=${mentor.scoreBreakdown.domainMatch}, Comm=${mentor.scoreBreakdown.communication}, CallType=${mentor.scoreBreakdown.callTypeSpecifics}, Bonus=${mentor.scoreBreakdown.additionalBoost}`);
  });

  console.log('\n' + '='.repeat(80));
}

/**
 * Display scoring configuration
 */
export function displayScoringConfig() {
  const config = getScoringConfig();
  console.log('\n⚙️  Scoring Configuration:');
  console.log(JSON.stringify(config, null, 2));
}

/**
 * Display detailed scoring for a specific mentor
 */
export function displayDetailedScoring(userProfile, mentor, callType) {
  const details = getMentorScoringDetails(userProfile, mentor, callType);

  console.log('\n' + '='.repeat(80));
  console.log(`📊 Detailed Scoring: ${details.mentor.name}`);
  console.log(`Call Type: ${details.callType}`);
  console.log('='.repeat(80));

  console.log(`\nTotal Score: ${details.totalScore.toFixed(1)}`);

  console.log('\nBreakdown:');
  console.log(`  Tag Matches: ${details.detailedBreakdown.tagMatches.score} (${details.detailedBreakdown.tagMatches.details})`);
  console.log(`  Keyword Matches: ${details.detailedBreakdown.keywordMatches.score.toFixed(1)} (${details.detailedBreakdown.keywordMatches.details})`);
  console.log(`  Domain Match: ${details.detailedBreakdown.domainMatch.score} (${details.detailedBreakdown.domainMatch.details})`);
  console.log(`  Communication: ${details.detailedBreakdown.communication.score} (${details.detailedBreakdown.communication.details})`);
  console.log(`  Call Type Specifics: ${details.detailedBreakdown.callTypeSpecifics.score} (${details.detailedBreakdown.callTypeSpecifics.details})`);

  console.log('\nReasoning:');
  details.reasoning.forEach(reason => {
    console.log(`  ${reason}`);
  });

  console.log('\n' + '='.repeat(80));
}

/**
 * Compare mentor scores for the same user
 */
export function compareMentorsForUser(user, mentorIds, callType = 'general_mentoring') {
  const selectedMentors = exampleMentors.filter(m => mentorIds.includes(m.id));
  
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 Mentor Comparison for: ${callType}`);
  console.log('='.repeat(80));

  selectedMentors.forEach(mentor => {
    displayDetailedScoring(user, mentor, callType);
  });
}

// Export test runner
export default {
  exampleUsers,
  exampleMentors,
  testResumeRevampRecommendation,
  testJobMarketGuidanceRecommendation,
  testMockInterviewRecommendation,
  testGeneralMentoringRecommendation,
  runAllTests,
  formatRecommendations,
  displayScoringConfig,
  displayDetailedScoring,
  compareMentorsForUser,
};
