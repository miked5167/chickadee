'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa'
import { Button } from '@/components/ui/button'

export function SearchBar() {
  const router = useRouter()
  const [location, setLocation] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Build search URL with query parameters
    const params = new URLSearchParams()
    if (location) {
      params.set('location', location)
    }

    router.push(`/listings?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-3 bg-white rounded-lg shadow-lg p-2">
        {/* Location Input */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-200">
          <FaMapMarkerAlt className="text-gray-400" />
          <input
            type="text"
            placeholder="City, State, or ZIP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          className="md:w-auto px-8 py-6 text-lg font-semibold"
        >
          <FaSearch className="mr-2" />
          Search Advisors
        </Button>
      </div>

      {/* Popular Searches */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-300 mb-2">Popular searches:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Boston, MA', 'Toronto, ON', 'Minneapolis, MN', 'Calgary, AB'].map((search) => (
            <button
              key={search}
              type="button"
              onClick={() => setLocation(search)}
              className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              {search}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}
