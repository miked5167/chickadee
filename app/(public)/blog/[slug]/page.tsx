import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react'
import { ShareButtons } from '@/components/blog/ShareButtons'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, meta_title, meta_description, featured_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image_url ? [post.featured_image_url] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the blog post with category and author info
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(name, slug, color),
      author:users_public(display_name, avatar_url)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    notFound()
  }

  // Fetch tags for this post
  const { data: postTags } = await supabase
    .from('blog_post_tags')
    .select('tag:blog_tags(id, name, slug)')
    .eq('post_id', post.id)

  const tags = postTags?.map(pt => pt.tag).filter(Boolean) || []

  // Fetch related posts (same category, exclude current)
  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image_url, published_at, read_time_minutes')
    .eq('category_id', post.category_id)
    .eq('status', 'published')
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3)

  // Track view (fire and forget)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/blog/track-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId: post.id }),
  }).catch(() => {})

  const publishedDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at)

  return (
    <>
      {/* Schema.org Article markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.featured_image_url,
            datePublished: publishedDate.toISOString(),
            dateModified: new Date(post.updated_at).toISOString(),
            author: {
              '@type': 'Person',
              name: post.author?.display_name || 'The Hockey Directory',
            },
            publisher: {
              '@type': 'Organization',
              name: 'The Hockey Directory',
              logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
              },
            },
          }),
        }}
      />

      <article className="min-h-screen bg-white">
        {/* Back to Blog */}
        <div className="bg-ice-blue border-b">
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-hockey-blue hover:text-hockey-red transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="relative w-full h-[400px] md:h-[500px] bg-neutral-gray/10">
            <Image
              src={post.featured_image_url}
              alt={post.featured_image_alt || post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Post Header */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <header className="mb-8">
            {/* Category Badge */}
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="inline-block mb-4"
              >
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: post.category.color }}
                >
                  {post.category.name}
                </span>
              </Link>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-puck-black mb-4">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-neutral-gray mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-gray">
              {post.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author.display_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={publishedDate.toISOString()}>
                  {publishedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              {post.read_time_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.read_time_minutes} min read</span>
                </div>
              )}
            </div>
          </header>

          {/* Post Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-12 pb-12 border-b">
              <h3 className="text-lg font-semibold text-puck-black mb-4">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: any) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="px-3 py-1 bg-ice-blue text-hockey-blue rounded-full text-sm hover:bg-hockey-blue hover:text-white transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <div className="mb-12 pb-12 border-b">
            <h3 className="text-lg font-semibold text-puck-black mb-4">
              Share this post
            </h3>
            <ShareButtons
              url={`${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`}
              title={post.title}
            />
          </div>

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-puck-black mb-6">
                Related Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group"
                  >
                    <article className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      {relatedPost.featured_image_url && (
                        <div className="relative w-full h-48">
                          <Image
                            src={relatedPost.featured_image_url}
                            alt={relatedPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-puck-black mb-2 group-hover:text-hockey-red transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        {relatedPost.excerpt && (
                          <p className="text-sm text-neutral-gray line-clamp-2 mb-2">
                            {relatedPost.excerpt}
                          </p>
                        )}
                        {relatedPost.read_time_minutes && (
                          <div className="flex items-center gap-1 text-xs text-neutral-gray">
                            <Clock className="w-3 h-3" />
                            <span>{relatedPost.read_time_minutes} min read</span>
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  )
}
