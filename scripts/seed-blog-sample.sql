-- Seed sample blog data for testing
-- Run this in Supabase SQL Editor

-- Create sample categories (6 categories as mentioned in schema)
INSERT INTO blog_categories (name, slug, description, icon, color, post_count) VALUES
('Player Development', 'player-development', 'Tips and strategies for developing young hockey players', '🏒', '#003366', 2),
('College Recruiting', 'college-recruiting', 'Navigate the college hockey recruitment process', '🎓', '#1E40AF', 2),
('Training & Fitness', 'training-fitness', 'Off-ice training, strength, and conditioning advice', '💪', '#059669', 1),
('Parents Guide', 'parents-guide', 'Essential information for hockey parents', '👨‍👩‍👧‍👦', '#DC2626', 1),
('Women''s Hockey', 'womens-hockey', 'Opportunities and resources for female players', '⭐', '#9333EA', 1),
('Advisor Spotlights', 'advisor-spotlights', 'Interviews with top hockey advisors', '🌟', '#EA580C', 1)
ON CONFLICT (slug) DO UPDATE SET post_count = EXCLUDED.post_count;

-- Get the admin user ID (you'll need to replace this with an actual user ID)
-- For testing, let's create a sample blog post with a placeholder author

-- First, let's insert sample blog posts
-- Note: You'll need to replace 'YOUR_USER_ID_HERE' with an actual auth.users id

-- Sample Post 1: Featured Post
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  featured_image_alt,
  author_id,
  category_id,
  meta_title,
  meta_description,
  status,
  is_featured,
  published_at,
  view_count,
  read_time_minutes
) VALUES (
  '10 Essential Skills Every Youth Hockey Player Should Master',
  '10-essential-skills-youth-hockey',
  'From skating fundamentals to game awareness, these ten core skills form the foundation of every great hockey player''s development journey.',
  E'# 10 Essential Skills Every Youth Hockey Player Should Master\n\nDeveloping young hockey players requires a balanced approach to skill development. Here are the ten most important skills every youth player should focus on:\n\n## 1. Skating Fundamentals\n\nSkating is the foundation of hockey. Players must master forward skating, backward skating, crossovers, and quick starts and stops.\n\n## 2. Puck Control\n\nThe ability to maintain control of the puck while skating at speed is crucial for all positions.\n\n## 3. Passing Accuracy\n\nGreat teams are built on crisp, accurate passing. Practice both forehand and backhand passes.\n\n## 4. Shooting Technique\n\nDevelop a variety of shots: wrist shot, snap shot, slap shot, and backhand.\n\n## 5. Positioning\n\nUnderstanding where to be on the ice is as important as individual skills.\n\n## 6. Hockey IQ\n\nReading the play, anticipating movements, and making smart decisions.\n\n## 7. Physical Fitness\n\nStrength, endurance, and flexibility are essential for peak performance.\n\n## 8. Stickhandling\n\nThe ability to maneuver the puck around opponents and maintain possession.\n\n## 9. Defensive Skills\n\nAngling, gap control, stick checking, and body positioning.\n\n## 10. Mental Toughness\n\nResilience, focus, and the ability to perform under pressure.\n\n## Conclusion\n\nMastering these skills takes time, dedication, and proper coaching. Work with a qualified advisor to create a development plan tailored to your player''s needs.',
  'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=1200&h=630&fit=crop',
  'Youth hockey players practicing on ice',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'player-development'),
  '10 Essential Skills Every Youth Hockey Player Should Master',
  'From skating fundamentals to game awareness, these ten core skills form the foundation of every great hockey player''s development journey.',
  'published',
  true,
  NOW() - INTERVAL '2 days',
  156,
  8
);

-- Sample Post 2
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  featured_image_alt,
  author_id,
  category_id,
  status,
  is_featured,
  published_at,
  view_count,
  read_time_minutes
) VALUES (
  'The College Hockey Recruitment Timeline: A Parent''s Guide',
  'college-hockey-recruitment-timeline',
  'Understanding when and how to start the recruitment process can make all the difference in your player''s college hockey journey.',
  E'# The College Hockey Recruitment Timeline: A Parent''s Guide\n\nNavigating college hockey recruitment can be overwhelming. This guide breaks down the timeline and key milestones.\n\n## Freshman Year (Age 14-15)\n\n- Focus on skill development and grades\n- Start researching different college programs\n- Attend camps at target schools\n\n## Sophomore Year (Age 15-16)\n\n- Begin creating your hockey resume\n- Start emailing coaches\n- Attend showcase tournaments\n\n## Junior Year (Age 16-17)\n\n- Intensify contact with coaches\n- Schedule unofficial visits\n- Make your verbal commitment\n\n## Senior Year (Age 17-18)\n\n- Sign your National Letter of Intent\n- Maintain your grades and performance\n- Prepare for the transition to college\n\n## Key Takeaways\n\nThe recruitment process requires planning, persistence, and patience. Working with an experienced advisor can help you navigate this journey successfully.',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&h=630&fit=crop',
  'Hockey player in college game',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'college-recruiting'),
  'published',
  false,
  NOW() - INTERVAL '5 days',
  89,
  6
);

-- Sample Post 3
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  featured_image_alt,
  author_id,
  category_id,
  status,
  published_at,
  view_count,
  read_time_minutes
) VALUES (
  'Off-Ice Training: Building Strength and Endurance',
  'off-ice-training-guide',
  'A comprehensive guide to off-ice training programs that will improve your on-ice performance and reduce injury risk.',
  E'# Off-Ice Training: Building Strength and Endurance\n\nOff-ice training is crucial for developing complete hockey players. Here''s what you need to know.\n\n## Why Off-Ice Training Matters\n\nImproved strength, speed, and endurance translate directly to better on-ice performance.\n\n## Key Components\n\n### Strength Training\n- Squats and lunges for leg strength\n- Core exercises for stability\n- Upper body for shooting power\n\n### Conditioning\n- Interval training\n- Plyometrics\n- Agility drills\n\n### Flexibility\n- Dynamic stretching before workouts\n- Static stretching after\n- Yoga for recovery\n\n## Sample Weekly Schedule\n\nA balanced program includes 3-4 days of strength training and 2-3 days of conditioning.\n\n## Conclusion\n\nConsistent off-ice training will give you a competitive edge and help prevent injuries.',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=630&fit=crop',
  'Athlete training in gym',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'training-fitness'),
  'published',
  NOW() - INTERVAL '7 days',
  67,
  7
);

-- Create sample tags
INSERT INTO blog_tags (name, slug, post_count) VALUES
('Youth Hockey', 'youth-hockey', 2),
('Skill Development', 'skill-development', 2),
('College Hockey', 'college-hockey', 1),
('Recruiting', 'recruiting', 1),
('Training Tips', 'training-tips', 1),
('Fitness', 'fitness', 1),
('Parents', 'parents', 2)
ON CONFLICT (slug) DO UPDATE SET post_count = EXCLUDED.post_count;

-- Link posts to tags
INSERT INTO blog_post_tags (post_id, tag_id)
SELECT
  (SELECT id FROM blog_posts WHERE slug = '10-essential-skills-youth-hockey'),
  id
FROM blog_tags
WHERE slug IN ('youth-hockey', 'skill-development', 'parents');

INSERT INTO blog_post_tags (post_id, tag_id)
SELECT
  (SELECT id FROM blog_posts WHERE slug = 'college-hockey-recruitment-timeline'),
  id
FROM blog_tags
WHERE slug IN ('college-hockey', 'recruiting', 'parents');

INSERT INTO blog_post_tags (post_id, tag_id)
SELECT
  (SELECT id FROM blog_posts WHERE slug = 'off-ice-training-guide'),
  id
FROM blog_tags
WHERE slug IN ('training-tips', 'fitness', 'skill-development');

-- Update category post counts
UPDATE blog_categories SET post_count = (
  SELECT COUNT(*) FROM blog_posts
  WHERE blog_posts.category_id = blog_categories.id
  AND blog_posts.status = 'published'
);

-- Update tag post counts
UPDATE blog_tags SET post_count = (
  SELECT COUNT(*) FROM blog_post_tags
  WHERE blog_post_tags.tag_id = blog_tags.id
);

-- Success message
SELECT 'Blog sample data seeded successfully!' as message;
SELECT COUNT(*) as total_posts FROM blog_posts WHERE status = 'published';
SELECT COUNT(*) as total_categories FROM blog_categories;
SELECT COUNT(*) as total_tags FROM blog_tags;
