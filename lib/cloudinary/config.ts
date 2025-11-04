/**
 * Cloudinary Configuration
 * Handles image upload and management for advisor logos and team member photos
 */

import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export default cloudinary

/**
 * Cloudinary upload options for advisor logos
 */
export const LOGO_UPLOAD_OPTIONS = {
  folder: 'advisors/logos',
  transformation: [
    { width: 400, height: 400, crop: 'limit' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
  ],
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  max_bytes: 2 * 1024 * 1024, // 2MB
}

/**
 * Cloudinary upload options for team member photos
 */
export const TEAM_PHOTO_UPLOAD_OPTIONS = {
  folder: 'advisors/team',
  transformation: [
    { width: 300, height: 300, crop: 'fill', gravity: 'face' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
  ],
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  max_bytes: 2 * 1024 * 1024, // 2MB
}

/**
 * Generate upload signature for secure client-side uploads
 */
export function generateUploadSignature(
  publicId: string,
  timestamp: number
): string {
  const crypto = require('crypto')
  const params = `public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`
  return crypto.createHash('sha256').update(params).digest('hex')
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error)
    throw error
  }
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  try {
    // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/image.jpg
    const urlParts = url.split('/')
    const uploadIndex = urlParts.findIndex((part) => part === 'upload')

    if (uploadIndex === -1) return null

    // Skip the version part (v1234567890) if present
    const startIndex = urlParts[uploadIndex + 1].startsWith('v')
      ? uploadIndex + 2
      : uploadIndex + 1

    // Join remaining parts and remove file extension
    const publicId = urlParts
      .slice(startIndex)
      .join('/')
      .replace(/\.[^.]+$/, '')

    return publicId
  } catch (error) {
    console.error('Error extracting public ID:', error)
    return null
  }
}
