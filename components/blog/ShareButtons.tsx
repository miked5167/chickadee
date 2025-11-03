'use client'

import { Facebook, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonsProps {
  url: string
  title: string
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex gap-3">
      {/* Twitter */}
      <a
        href={shareUrls.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1DA1F2] text-white hover:opacity-90 transition-opacity"
        aria-label="Share on Twitter"
      >
        <Twitter className="w-5 h-5" />
      </a>

      {/* Facebook */}
      <a
        href={shareUrls.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-5 h-5" />
      </a>

      {/* LinkedIn */}
      <a
        href={shareUrls.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </a>

      {/* Copy Link */}
      <button
        onClick={copyToClipboard}
        className={`flex items-center justify-center w-10 h-10 rounded-full ${
          copied
            ? 'bg-green-600'
            : 'bg-neutral-gray hover:bg-neutral-gray/80'
        } text-white transition-all`}
        aria-label="Copy link"
      >
        <LinkIcon className="w-5 h-5" />
      </button>

      {copied && (
        <span className="flex items-center text-sm text-green-600 font-medium">
          Link copied!
        </span>
      )}
    </div>
  )
}
