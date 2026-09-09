import { permanentRedirect } from 'next/navigation'

export default function LegacyBlogPostPage() {
  permanentRedirect('/guides')
}
