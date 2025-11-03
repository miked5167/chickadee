import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Expert advice and insights for youth hockey players, parents, and coaches. Find the best hockey advisors, training tips, and development resources.',
  alternates: {
    types: {
      'application/rss+xml': '/api/blog/rss',
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
