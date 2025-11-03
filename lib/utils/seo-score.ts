export interface SEOCheck {
  name: string;
  passed: boolean;
  score: number; // 0-100
  message: string;
  weight: number; // How important this check is (1-10)
}

export interface SEOScore {
  totalScore: number; // 0-100
  checks: SEOCheck[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
}

/**
 * Calculate SEO score for a blog post
 *
 * @param data - Blog post data
 * @returns SEO score and checks
 */
export function calculateSEOScore(data: {
  title: string;
  excerpt: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
}): SEOScore {
  const checks: SEOCheck[] = [];

  // 1. Title Length Check (Weight: 9)
  const titleLength = data.title.length;
  const titleOptimal = titleLength >= 40 && titleLength <= 60;
  checks.push({
    name: 'Title Length',
    passed: titleOptimal,
    score: titleOptimal ? 100 : titleLength < 40 ? Math.max(0, (titleLength / 40) * 100) : Math.max(0, 100 - ((titleLength - 60) * 2)),
    message: titleOptimal
      ? `Title length is optimal (${titleLength} characters)`
      : titleLength < 40
        ? `Title is too short (${titleLength} characters). Aim for 40-60.`
        : `Title is too long (${titleLength} characters). Aim for 40-60.`,
    weight: 9,
  });

  // 2. Meta Description Length Check (Weight: 8)
  const metaDesc = data.metaDescription || data.excerpt;
  const metaDescLength = metaDesc.length;
  const metaDescOptimal = metaDescLength >= 140 && metaDescLength <= 160;
  checks.push({
    name: 'Meta Description Length',
    passed: metaDescOptimal,
    score: metaDescOptimal ? 100 : metaDescLength < 140 ? Math.max(0, (metaDescLength / 140) * 100) : Math.max(0, 100 - ((metaDescLength - 160) * 2)),
    message: metaDescOptimal
      ? `Meta description is optimal (${metaDescLength} characters)`
      : metaDescLength < 140
        ? `Meta description is too short (${metaDescLength} characters). Aim for 140-160.`
        : `Meta description is too long (${metaDescLength} characters). Aim for 140-160.`,
    weight: 8,
  });

  // 3. Content Length Check (Weight: 10)
  const contentText = stripHTML(data.content);
  const wordCount = contentText.split(/\s+/).filter(word => word.length > 0).length;
  const contentLengthOptimal = wordCount >= 800;
  checks.push({
    name: 'Content Length',
    passed: contentLengthOptimal,
    score: Math.min(100, (wordCount / 800) * 100),
    message: contentLengthOptimal
      ? `Content length is good (${wordCount} words)`
      : `Content is short (${wordCount} words). Aim for at least 800 words for better SEO.`,
    weight: 10,
  });

  // 4. Heading Structure Check (Weight: 7)
  const hasH1 = /<h1[^>]*>/.test(data.content);
  const h2Count = (data.content.match(/<h2[^>]*>/g) || []).length;
  const hasProperHeadings = hasH1 && h2Count >= 2;
  checks.push({
    name: 'Heading Structure',
    passed: hasProperHeadings,
    score: hasProperHeadings ? 100 : hasH1 ? 60 : 20,
    message: hasProperHeadings
      ? `Good heading structure with H1 and ${h2Count} H2 headings`
      : hasH1
        ? `Has H1 but needs more H2 headings (found ${h2Count}, recommend at least 2)`
        : 'Missing H1 heading. Add headings to structure your content.',
    weight: 7,
  });

  // 5. Featured Image Check (Weight: 6)
  const hasFeaturedImage = !!data.featuredImageUrl;
  const hasImageAlt = !!data.featuredImageAlt;
  checks.push({
    name: 'Featured Image',
    passed: hasFeaturedImage && hasImageAlt,
    score: hasFeaturedImage ? (hasImageAlt ? 100 : 70) : 0,
    message: hasFeaturedImage
      ? hasImageAlt
        ? 'Featured image with alt text present'
        : 'Featured image present but missing alt text'
      : 'No featured image. Add one to improve social sharing and SEO.',
    weight: 6,
  });

  // 6. Internal/External Links Check (Weight: 7)
  const linkCount = (data.content.match(/<a[^>]*href/g) || []).length;
  const hasLinks = linkCount >= 2;
  checks.push({
    name: 'Links',
    passed: hasLinks,
    score: Math.min(100, (linkCount / 3) * 100),
    message: hasLinks
      ? `Good: ${linkCount} links found`
      : linkCount === 1
        ? 'Only 1 link found. Add 2-3 more relevant links.'
        : 'No links found. Add 2-3 relevant internal/external links.',
    weight: 7,
  });

  // 7. URL Slug Check (Weight: 5)
  const slugLength = data.slug.length;
  const slugOptimal = slugLength >= 10 && slugLength <= 60;
  const hasStopWords = /\b(the|a|an|and|or|but|in|on|at|to|for)\b/.test(data.slug);
  checks.push({
    name: 'URL Slug',
    passed: slugOptimal && !hasStopWords,
    score: slugOptimal ? (hasStopWords ? 70 : 100) : 50,
    message: slugOptimal
      ? hasStopWords
        ? 'URL slug contains stop words. Consider removing "the", "a", "and", etc.'
        : `URL slug is optimized (${slugLength} characters)`
      : slugLength < 10
        ? `URL slug is too short (${slugLength} characters)`
        : `URL slug is too long (${slugLength} characters)`,
    weight: 5,
  });

  // 8. Images in Content Check (Weight: 6)
  const imageCount = (data.content.match(/<img[^>]*>/g) || []).length;
  const imagesWithAlt = (data.content.match(/<img[^>]*alt=["'][^"']+["']/g) || []).length;
  const hasImages = imageCount >= 1;
  checks.push({
    name: 'Images in Content',
    passed: hasImages && imageCount === imagesWithAlt,
    score: hasImages ? (imageCount === imagesWithAlt ? 100 : 60) : 30,
    message: hasImages
      ? imageCount === imagesWithAlt
        ? `${imageCount} images with alt text`
        : `${imageCount} images found, but ${imageCount - imagesWithAlt} missing alt text`
      : 'No images in content. Add relevant images to improve engagement.',
    weight: 6,
  });

  // 9. Keyword in Title Check (Weight: 8)
  // Extract first few words from title as potential keyword
  const potentialKeyword = data.title.toLowerCase().split(' ').slice(0, 3).join(' ');
  const keywordInContent = data.content.toLowerCase().includes(potentialKeyword);
  checks.push({
    name: 'Keyword Focus',
    passed: keywordInContent,
    score: keywordInContent ? 100 : 40,
    message: keywordInContent
      ? 'Title keywords appear in content'
      : 'Title keywords should appear in the content',
    weight: 8,
  });

  // Calculate total weighted score
  let totalWeightedScore = 0;
  let totalWeight = 0;

  checks.forEach(check => {
    totalWeightedScore += check.score * check.weight;
    totalWeight += check.weight * 100; // Max score per check is 100
  });

  const totalScore = Math.round(totalWeightedScore / totalWeight * 100);

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';
  else grade = 'F';

  // Generate summary
  const passedCount = checks.filter(c => c.passed).length;
  const summary = `${passedCount} of ${checks.length} SEO checks passed`;

  return {
    totalScore,
    checks,
    grade,
    summary,
  };
}

/**
 * Helper function to strip HTML tags from content
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Get color class for SEO score display
 */
export function getSEOScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-green-500';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get background color class for SEO score display
 */
export function getSEOScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-100';
  if (score >= 80) return 'bg-green-50';
  if (score >= 70) return 'bg-yellow-50';
  if (score >= 60) return 'bg-orange-50';
  return 'bg-red-50';
}
