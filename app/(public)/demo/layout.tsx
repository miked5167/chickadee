import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advisor Dashboard Demo',
  robots: { index: false, follow: false, nocache: true },
}

export default function DemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <div className="bg-goal-gold px-4 py-3 text-center text-sm font-bold text-arena-navy" role="status">
        Demonstration only — every name, review, lead, and metric shown below is sample data.
      </div>
      {children}
    </div>
  )
}
