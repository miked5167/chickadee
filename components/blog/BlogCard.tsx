import Link from 'next/link'
import Image from 'next/image'
import { FaClock, FaEye, FaUser } from 'react-icons/fa'

interface BlogCardProps {
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
    tags?: Array<{
      id: string
      name: string
      slug: string
    }>
  }
  variant?: 'default' | 'compact'
}

export function BlogCard({ post, variant = 'default' }: BlogCardProps) {
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
    tags
  } = post

  const publishedDate = new Date(published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (variant === 'compact') {
    return (
      <Link
        href={`/blog/${slug}`}
        className="group block"
      >
        <div className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
          {featured_image_url && (
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={featured_image_url}
                alt={featured_image_alt || title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-hockey-blue transition-colors line-clamp-2 mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-500">{publishedDate}</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col"
    >
      {/* Featured Image */}
      {featured_image_url && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={featured_image_url}
            alt={featured_image_alt || title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {category && (
            <div
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-semibold"
              style={{ backgroundColor: category.color || '#003366' }}
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-hockey-blue transition-colors mb-3 line-clamp-2">
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
            {excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center gap-4">
            {author && (
              <div className="flex items-center gap-2">
                {author.avatar_url ? (
                  <Image
                    src={author.avatar_url}
                    alt={author.display_name || 'Author'}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <FaUser className="w-4 h-4" />
                )}
                <span className="text-sm">{author.display_name || 'Anonymous'}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <FaClock className="w-3 h-3" />
              <span>{read_time_minutes || 5} min read</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <FaEye className="w-3 h-3" />
            <span>{view_count}</span>
          </div>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
