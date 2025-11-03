import { Metadata } from 'next'
import Link from 'next/link'
import { BlogPostForm } from '@/components/forms/BlogPostForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'New Blog Post - Admin',
  description: 'Create a new blog post',
}

export default function NewBlogPostPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <Link href="/admin/blog">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Blog Post</h1>
      </div>

      <BlogPostForm />
    </div>
  )
}
