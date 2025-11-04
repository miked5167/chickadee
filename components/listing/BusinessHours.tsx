'use client'

import { Clock } from 'lucide-react'

interface BusinessHoursProps {
  hours: Record<string, string>
}

export function BusinessHours({ hours }: BusinessHoursProps) {
  if (!hours || Object.keys(hours).length === 0) {
    return null
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // Group consecutive days with the same hours
  const groupedHours: { days: string; hours: string }[] = []
  let currentGroup: { days: string[]; hours: string } | null = null

  daysOfWeek.forEach((day) => {
    const dayHours = hours[day] || 'Closed'

    if (currentGroup && currentGroup.hours === dayHours) {
      // Add to current group
      currentGroup.days.push(day)
    } else {
      // Start new group
      if (currentGroup) {
        groupedHours.push({
          days: formatDayRange(currentGroup.days),
          hours: currentGroup.hours
        })
      }
      currentGroup = { days: [day], hours: dayHours }
    }
  })

  // Add the last group
  if (currentGroup) {
    groupedHours.push({
      days: formatDayRange(currentGroup.days),
      hours: currentGroup.hours
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="font-semibold text-sm">Hours of Operation</span>
      </div>
      <div className="space-y-1">
        {groupedHours.map((group, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-700">{group.days}:</span>
            <span className={`font-medium ${group.hours.toLowerCase() === 'closed' ? 'text-gray-400' : 'text-gray-900'}`}>
              {group.hours}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDayRange(days: string[]): string {
  if (days.length === 1) {
    return abbreviateDay(days[0])
  }

  if (days.length === 7) {
    return 'Every Day'
  }

  // Check if it's a continuous range
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const indices = days.map(day => daysOfWeek.indexOf(day))
  const isConsecutive = indices.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1)

  if (isConsecutive && days.length > 1) {
    return `${abbreviateDay(days[0])} - ${abbreviateDay(days[days.length - 1])}`
  }

  // Not consecutive, list them all
  return days.map(abbreviateDay).join(', ')
}

function abbreviateDay(day: string): string {
  const abbreviations: Record<string, string> = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  }
  return abbreviations[day] || day
}
