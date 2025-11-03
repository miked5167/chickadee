import Link from 'next/link'
import Image from 'next/image'
import { FaClock, FaEye, FaUser } from 'react-icons/fa'

interface BlogHeroProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    featured_image_url: string | null
    featured_image_alt: string | null
    published_at: string
    read_time_minutes: number | null
    view_count: number
    blog_categories: {
      id: string
      name: string
      slug: string
      icon: string | null
      color: string | null
    } | null
    users_public: {
      id: string
      display_name: string | null
      avatar_url: string | null
    } | null
  }
}

export function BlogHero({ post }: BlogHeroProps) {
  const {
    title,
    slug,
    excerpt,
    featured_image_url,
    featured_image_alt,
    published_at,
    read_time_minutes,
    view_count,
    blog_categories: category,
    users_public: author,
  } = post

  const publishedDate = new Date(published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      <div className="grid md:grid-cols-2 gap-0">
        {/* Featured Image */}
        {featured_image_url && (
          <div className="relative aspect-video md:aspect-square overflow-hidden">
            <Image
              src={featured_image_url}
              alt={featured_image_alt || title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
            {category && (
              <div
                className="absolute top-6 left-6 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg"
                style={{ backgroundColor: category.color || '#003366' }}
              >
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full mb-4">
              ⭐ Featured Post
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 group-hover:text-hockey-blue transition-colors mb-4 line-clamp-3">
            {title}
          </h2>

          {excerpt && (
            <p className="text-lg text-gray-600 mb-6 line-clamp-3">
              {excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            {author && (
              <div className="flex items-center gap-2">
                {author.avatar_url ? (
                  <Image
                    src={author.avatar_url}
                    alt={author.display_name || 'Author'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{author.display_name || 'Anonymous'}</p>
                  <p className="text-xs">{publishedDate}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FaClock className="w-4 h-4" />
                <span>{read_time_minutes || 5} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <FaEye className="w-4 h-4" />
                <span>{view_count}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 text-hockey-blue font-semibold group-hover:gap-3 transition-all">
              Read Full Article
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
