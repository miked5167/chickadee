import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
}

export function StarRating({ rating, maxRating = 5, size = 'md', showNumber = false }: StarRatingProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const sizeClass = sizeClasses[size]

  // Round to nearest 0.5
  const roundedRating = Math.round(rating * 2) / 2

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => {
        const starNumber = i + 1
        const filled = starNumber <= Math.floor(roundedRating)
        const halfFilled = starNumber === Math.ceil(roundedRating) && roundedRating % 1 !== 0

        return (
          <div key={i} className="relative">
            {halfFilled ? (
              <>
                <Star className={`${sizeClass} text-gray-300`} />
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className={`${sizeClass} fill-yellow-400 text-yellow-400`} />
                </div>
              </>
            ) : (
              <Star
                className={`${sizeClass} ${
                  filled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            )}
          </div>
        )
      })}
      {showNumber && (
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
