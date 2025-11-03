import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlogPostForm } from '@/components/forms/BlogPostForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Blog Post - Admin',
  description: 'Edit blog post',
}

interface EditBlogPostPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the blog post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  // Fetch associated tags
  const { data: postTags } = await supabase
    .from('blog_post_tags')
    .select('tag_id, tag:blog_tags(id, name, slug)')
    .eq('post_id', id)

  const tags = postTags?.map(pt => pt.tag).filter(Boolean) || []

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <Link href="/admin/blog">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Blog Post</h1>
      </div>

      <BlogPostForm
        postId={post.id}
        initialData={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featured_image_url: post.featured_image_url,
          featured_image_alt: post.featured_image_alt,
          category_id: post.category_id,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          status: post.status,
          is_featured: post.is_featured,
          tags: tags as any,
        }}
      />
    </div>
  )
}
