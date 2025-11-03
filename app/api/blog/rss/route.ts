import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * RSS Feed for The Hockey Directory Blog
 * Returns RSS 2.0 format XML with the latest 50 blog posts
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch the last 50 published blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        published_at,
        updated_at,
        featured_image_url,
        author_id
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching blog posts for RSS:', error);
      throw error;
    }

    // Site information
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const siteName = 'The Hockey Directory Blog';
    const siteDescription = 'Expert advice and insights for youth hockey players, parents, and coaches. Find the best hockey advisors, training tips, and development resources.';
    const currentDate = new Date().toUTCString();

    // Generate RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}/blog</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${siteUrl}/api/blog/rss" rel="self" type="application/rss+xml"/>
    <generator>Next.js</generator>
    <webMaster>noreply@thehockeydirectory.com (The Hockey Directory)</webMaster>
    <managingEditor>noreply@thehockeydirectory.com (The Hockey Directory)</managingEditor>
    <copyright>Copyright ${new Date().getFullYear()} The Hockey Directory</copyright>
    <ttl>60</ttl>
${posts?.map(post => {
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const pubDate = new Date(post.published_at || post.updated_at).toUTCString();

  // Strip HTML from content for description, limit to 300 characters
  const description = stripHtml(post.excerpt || post.content).substring(0, 300);

  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>The Hockey Directory Team</dc:creator>
      ${post.featured_image_url ? `<enclosure url="${escapeXml(post.featured_image_url)}" type="image/jpeg"/>` : ''}
    </item>`;
}).join('\n')}
  </channel>
</rss>`;

    // Return XML response with proper headers
    return new NextResponse(rss, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });

  } catch (error) {
    console.error('RSS feed error:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
