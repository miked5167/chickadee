/**
 * Facebook Groups Market Research Analysis
 * Analyzes hockey-related Facebook group posts to extract insights
 */

import * as fs from 'fs';
import * as path from 'path';

interface FacebookPost {
  facebookUrl: string;
  text: string;
  user: {
    id: string;
    name: string;
  };
  likesCount: number;
  commentsCount: number;
  attachments?: any[];
}

interface MarketInsight {
  topic: string;
  mentions: number;
  examples: string[];
  painPoints: string[];
  opportunities: string[];
}

async function analyzeFacebookGroups() {
  console.log('📊 Facebook Groups Market Research Analysis\n');
  console.log('='.repeat(80) + '\n');

  // Read the dataset
  const dataPath = 'c:\\Users\\miked\\Downloads\\dataset_facebook-groups-scraper_2025-11-05_18-27-03-632.json';
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const posts: FacebookPost[] = JSON.parse(rawData);

  console.log(`Total posts analyzed: ${posts.length.toLocaleString()}\n`);
  console.log('='.repeat(80) + '\n');

  // Filter posts with actual text content
  const postsWithText = posts.filter(p => p.text && p.text.trim().length > 0);
  console.log(`Posts with text content: ${postsWithText.length.toLocaleString()}\n`);

  // Category keywords to search for
  const categories = {
    'Hockey Camps': ['camp', 'summer camp', 'hockey camp', 'overnight camp', 'day camp'],
    'Hockey Coaching': ['coach', 'coaching', 'trainer', 'instruction', 'private lesson', 'skills coach'],
    'Hockey Training': ['training', 'skills', 'development', 'practice', 'drills', 'workout'],
    'Hockey Tournaments': ['tournament', 'tourney', 'showcase', 'event', 'competition'],
    'Hockey Equipment': ['equipment', 'gear', 'stick', 'skates', 'helmet', 'gloves', 'pads'],
    'Hockey Leagues': ['league', 'team', 'roster', 'tryouts', 'aaa', 'aa', 'travel team'],
    'Hockey Prep Schools': ['prep school', 'academy', 'boarding school', 'hockey school'],
    'Hockey Scholarships': ['scholarship', 'college', 'ncaa', 'recruiting', 'commitment'],
    'Hockey Arenas/Rinks': ['rink', 'arena', 'ice time', 'public skate', 'stick and puck'],
    'Hockey Fees/Costs': ['fee', 'cost', 'price', 'expensive', 'afford', '$', 'payment', 'tuition'],
    'Geographic Locations': ['near me', 'location', 'area', 'state', 'city', 'region'],
    'Parent Concerns': ['parent', 'mom', 'dad', 'family', 'stress', 'balance', 'burnout'],
  };

  // Analyze by category
  const categoryResults: Record<string, { count: number; posts: FacebookPost[] }> = {};

  for (const [category, keywords] of Object.entries(categories)) {
    const matchingPosts = postsWithText.filter(post => {
      const textLower = post.text.toLowerCase();
      return keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
    });

    categoryResults[category] = {
      count: matchingPosts.length,
      posts: matchingPosts,
    };
  }

  // Display category breakdown
  console.log('📋 TOPIC BREAKDOWN\n');
  console.log('Category'.padEnd(30) + 'Mentions'.padStart(10) + ' % of Total'.padStart(15));
  console.log('-'.repeat(55));

  const sortedCategories = Object.entries(categoryResults).sort((a, b) => b[1].count - a[1].count);

  for (const [category, data] of sortedCategories) {
    const percentage = ((data.count / postsWithText.length) * 100).toFixed(1);
    console.log(
      category.padEnd(30) +
      data.count.toString().padStart(10) +
      `${percentage}%`.padStart(15)
    );
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Extract specific pain points and questions
  console.log('🔍 KEY INSIGHTS & PAIN POINTS\n');

  // Questions (posts with ? mark)
  const questions = postsWithText.filter(p => p.text.includes('?'));
  console.log(`Questions asked: ${questions.length} (${((questions.length / postsWithText.length) * 100).toFixed(1)}% of posts)\n`);

  // Common question patterns
  const questionPatterns = [
    { pattern: /looking for|need|anyone know|recommend|suggestion/i, label: 'Seeking Recommendations' },
    { pattern: /how much|cost|price|fee|expensive/i, label: 'Pricing Questions' },
    { pattern: /best|top|good|quality/i, label: 'Quality/Comparison Questions' },
    { pattern: /near|location|area|where/i, label: 'Location/Availability Questions' },
    { pattern: /worth it|should i|is it/i, label: 'Decision/Validation Questions' },
  ];

  console.log('Common Question Types:\n');
  for (const { pattern, label } of questionPatterns) {
    const matches = questions.filter(q => pattern.test(q.text));
    console.log(`  ${label}: ${matches.length} posts`);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Sample high-engagement posts by category
  console.log('💬 HIGH-ENGAGEMENT POSTS BY CATEGORY\n');

  for (const [category, data] of sortedCategories.slice(0, 5)) {
    console.log(`\n${category}:`);
    console.log('-'.repeat(40));

    // Get top 3 posts by engagement (likes + comments)
    const topPosts = data.posts
      .map(p => ({
        ...p,
        engagement: p.likesCount + p.commentsCount * 3, // Weight comments more
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 3);

    topPosts.forEach((post, i) => {
      const preview = post.text.substring(0, 150).replace(/\n/g, ' ').replace(/"/g, "'").replace(/`/g, "'");
      const suffix = post.text.length > 150 ? '...' : '';
      console.log(`\n${i + 1}. [${post.likesCount} likes, ${post.commentsCount} comments]`);
      console.log('   "' + preview + suffix + '"');
    });
    console.log();
  }

  console.log('='.repeat(80) + '\n');

  // Extract specific feature requests and needs
  console.log('💡 FEATURE OPPORTUNITIES FOR HOCKEY DIRECTORY\n');

  const opportunities = [
    {
      need: 'Price Transparency',
      evidence: categoryResults['Hockey Fees/Costs'].count,
      solution: 'Show pricing info for camps, coaching, leagues',
    },
    {
      need: 'Local Search',
      evidence: postsWithText.filter(p => /near me|in my area|local/i.test(p.text)).length,
      solution: 'Strong geographic filters and "near me" functionality',
    },
    {
      need: 'Quality Validation',
      evidence: postsWithText.filter(p => /worth it|good camp|recommend|scam|money grab/i.test(p.text)).length,
      solution: 'Reviews, ratings, verified listings',
    },
    {
      need: 'Comparison Tools',
      evidence: postsWithText.filter(p => /vs|versus|compare|better|best/i.test(p.text)).length,
      solution: 'Side-by-side comparison of camps, coaches, programs',
    },
    {
      need: 'Camp Discovery',
      evidence: categoryResults['Hockey Camps'].count,
      solution: 'Comprehensive camp directory with filters (age, level, location)',
    },
    {
      need: 'Coach Matching',
      evidence: categoryResults['Hockey Coaching'].count,
      solution: 'Coach profiles with specialties, availability, pricing',
    },
  ];

  opportunities.sort((a, b) => b.evidence - a.evidence);

  opportunities.forEach((opp, i) => {
    console.log(`${i + 1}. ${opp.need}`);
    console.log(`   Evidence: ${opp.evidence} related posts`);
    console.log(`   Solution: ${opp.solution}\n`);
  });

  console.log('='.repeat(80) + '\n');

  // Extract specific examples
  console.log('📝 REPRESENTATIVE POSTS (Pain Points)\n');

  const painPointExamples = [
    {
      category: 'Pricing Confusion',
      posts: postsWithText.filter(p => /how much|cost|price|fee/i.test(p.text)).slice(0, 2),
    },
    {
      category: 'Quality Concerns',
      posts: postsWithText.filter(p => /worth it|good|scam|money grab/i.test(p.text)).slice(0, 2),
    },
    {
      category: 'Discovery Problems',
      posts: postsWithText.filter(p => /looking for|need to find|anyone know/i.test(p.text)).slice(0, 2),
    },
  ];

  for (const { category, posts: examplePosts } of painPointExamples) {
    console.log(`\n${category}:`);
    console.log('-'.repeat(60));
    examplePosts.forEach(post => {
      const preview = post.text.substring(0, 200).replace(/\n/g, ' ').replace(/"/g, "'").replace(/`/g, "'");
      const suffix = post.text.length > 200 ? '...' : '';
      console.log('\n"' + preview + suffix + '"');
    });
    console.log();
  }

  console.log('='.repeat(80) + '\n');

  // Generate recommendations
  console.log('🎯 STRATEGIC RECOMMENDATIONS FOR HOCKEY DIRECTORY\n');

  const recommendations = [
    {
      priority: 'HIGH',
      feature: 'Price Transparency',
      rationale: `${categoryResults['Hockey Fees/Costs'].count} posts about fees/costs. Parents desperately want pricing info upfront.`,
      implementation: 'Require camps/coaches to display pricing ranges, payment plans, and hidden fees.',
    },
    {
      priority: 'HIGH',
      feature: 'Reviews & Trust Signals',
      rationale: `${postsWithText.filter(p => /worth it|good|recommend|scam/i.test(p.text)).length} posts seeking validation. Parents fear "money grabs."`,
      implementation: 'Verified reviews, ratings, "parent feedback" sections, badge for established providers.',
    },
    {
      priority: 'HIGH',
      feature: 'Geographic Discovery',
      rationale: `${postsWithText.filter(p => /near me|local|area/i.test(p.text)).length} posts searching for local options.`,
      implementation: 'Map view, "near me" search, distance filters, multi-city search.',
    },
    {
      priority: 'MEDIUM',
      feature: 'Camp Comparison Tool',
      rationale: `${categoryResults['Hockey Camps'].count} camp-related posts. Parents need to compare multiple options.`,
      implementation: 'Side-by-side comparison: price, dates, age groups, overnight vs day, skill level.',
    },
    {
      priority: 'MEDIUM',
      feature: 'Coach Profiles & Specialties',
      rationale: `${categoryResults['Hockey Coaching'].count} coaching posts. Parents want specific expertise (goalie, skills, etc.).`,
      implementation: 'Coach bios, certifications, specialties, availability calendar, booking.',
    },
    {
      priority: 'LOW',
      feature: 'Community Q&A Section',
      rationale: `${questions.length} questions asked in groups. Build engagement on your platform.`,
      implementation: 'Forum or Q&A feature where parents can ask and answer hockey-related questions.',
    },
  ];

  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. [${rec.priority}] ${rec.feature}`);
    console.log(`   Rationale: ${rec.rationale}`);
    console.log(`   Implementation: ${rec.implementation}\n`);
  });

  console.log('='.repeat(80) + '\n');

  // Save detailed results
  const outputDir = path.join(process.cwd(), 'market-research');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const outputFile = path.join(outputDir, `facebook-groups-insights-${timestamp}.json`);

  const reportData = {
    date: timestamp,
    totalPosts: posts.length,
    postsWithText: postsWithText.length,
    categoryBreakdown: Object.fromEntries(
      Object.entries(categoryResults).map(([cat, data]) => [cat, data.count])
    ),
    opportunities,
    recommendations,
    topPostsByCategory: Object.fromEntries(
      sortedCategories.slice(0, 5).map(([cat, data]) => [
        cat,
        data.posts
          .map(p => ({
            text: p.text,
            likes: p.likesCount,
            comments: p.commentsCount,
            engagement: p.likesCount + p.commentsCount * 3,
          }))
          .sort((a, b) => b.engagement - a.engagement)
          .slice(0, 5),
      ])
    ),
  };

  fs.writeFileSync(outputFile, JSON.stringify(reportData, null, 2));

  console.log(`✅ Detailed report saved to: ${outputFile}\n`);
  console.log('='.repeat(80) + '\n');

  console.log('🎯 EXECUTIVE SUMMARY\n');
  console.log(`Analyzed ${posts.length.toLocaleString()} Facebook posts from hockey parent groups.\n`);
  console.log('Top 3 Pain Points:');
  console.log(`  1. Price Transparency (${categoryResults['Hockey Fees/Costs'].count} posts)`);
  console.log(`  2. Camp Discovery & Selection (${categoryResults['Hockey Camps'].count} posts)`);
  console.log(`  3. Quality Validation (${postsWithText.filter(p => /worth it|good|recommend/i.test(p.text)).length} posts)\n`);
  console.log('Key Insight: Parents are asking Facebook groups questions that a comprehensive');
  console.log('directory could answer: "What camps are near me?", "How much does X cost?",');
  console.log('"Is Y camp worth it?", "Who has a good goalie coach?"\n');
  console.log('💡 Your hockey directory should solve these discovery and validation problems.\n');
}

// Run
analyzeFacebookGroups()
  .then(() => {
    console.log('✅ Analysis complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
