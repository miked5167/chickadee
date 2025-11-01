export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <article className="prose prose-lg max-w-none">
          {children}
        </article>
      </div>
    </div>
  )
}
