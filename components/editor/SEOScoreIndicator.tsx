'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { calculateSEOScore, getSEOScoreColor, getSEOScoreBgColor } from '@/lib/utils/seo-score'
import { Check, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface SEOScoreIndicatorProps {
  title: string
  excerpt: string
  content: string
  metaTitle?: string
  metaDescription?: string
  slug: string
  featuredImageUrl?: string
  featuredImageAlt?: string
}

export function SEOScoreIndicator({
  title,
  excerpt,
  content,
  metaTitle,
  metaDescription,
  slug,
  featuredImageUrl,
  featuredImageAlt,
}: SEOScoreIndicatorProps) {
  const [expanded, setExpanded] = useState(false)

  const seoScore = useMemo(() => {
    return calculateSEOScore({
      title,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      slug,
      featuredImageUrl,
      featuredImageAlt,
    })
  }, [title, excerpt, content, metaTitle, metaDescription, slug, featuredImageUrl, featuredImageAlt])

  const scoreColor = getSEOScoreColor(seoScore.totalScore)
  const scoreBgColor = getSEOScoreBgColor(seoScore.totalScore)

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header with Score */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">SEO Score</h3>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full ${scoreBgColor}`}>
              <span className={`text-2xl font-bold ${scoreColor}`}>
                {seoScore.totalScore}
              </span>
              <span className="text-gray-600 text-sm ml-1">/ 100</span>
            </div>
            <div className={`px-2 py-1 rounded ${scoreBgColor}`}>
              <span className={`text-xl font-bold ${scoreColor}`}>
                {seoScore.grade}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{seoScore.summary}</p>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-hockey-blue hover:underline"
          >
            {expanded ? (
              <>
                Hide Details <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show Details <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              seoScore.totalScore >= 90
                ? 'bg-green-600'
                : seoScore.totalScore >= 80
                  ? 'bg-green-500'
                  : seoScore.totalScore >= 70
                    ? 'bg-yellow-500'
                    : seoScore.totalScore >= 60
                      ? 'bg-orange-500'
                      : 'bg-red-500'
            }`}
            style={{ width: `${seoScore.totalScore}%` }}
          />
        </div>

        {/* Detailed Checks */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700">SEO Checks</h4>
            <div className="space-y-2">
              {seoScore.checks.map((check, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    check.passed ? 'bg-green-50' : 'bg-orange-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {check.passed ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : check.score >= 50 ? (
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {check.name}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        {Math.round(check.score)}/100
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {seoScore.totalScore < 80 && !expanded && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Click "Show Details" to see how to improve your SEO score.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
