'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfileSectionProps } from '@/types/advisor'
import { Instagram, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react'
import { SiTiktok } from 'react-icons/si'

export function SocialMediaSection({ data, onChange, errors, mode = 'advisor' }: ProfileSectionProps) {
  const socialPlatforms = [
    {
      id: 'instagram_url',
      label: 'Instagram',
      icon: Instagram,
      placeholder: 'https://instagram.com/youradvisory',
      color: 'text-pink-600'
    },
    {
      id: 'facebook_url',
      label: 'Facebook',
      icon: Facebook,
      placeholder: 'https://facebook.com/youradvisory',
      color: 'text-blue-600'
    },
    {
      id: 'twitter_url',
      label: 'Twitter / X',
      icon: Twitter,
      placeholder: 'https://twitter.com/youradvisory',
      color: 'text-sky-500'
    },
    {
      id: 'linkedin_url',
      label: 'LinkedIn',
      icon: Linkedin,
      placeholder: 'https://linkedin.com/company/youradvisory',
      color: 'text-blue-700'
    },
    {
      id: 'tiktok_url',
      label: 'TikTok',
      icon: null,
      customIcon: SiTiktok,
      placeholder: 'https://tiktok.com/@youradvisory',
      color: 'text-gray-900'
    },
    {
      id: 'youtube_url',
      label: 'YouTube',
      icon: Youtube,
      placeholder: 'https://youtube.com/@youradvisory',
      color: 'text-red-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media</CardTitle>
        <CardDescription>
          {mode === 'advisor'
            ? 'Add your social media profiles. These will appear as clickable icons on your profile.'
            : 'Advisor social media profiles'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {socialPlatforms.map((platform) => {
          const Icon = platform.customIcon || platform.icon
          return (
            <div key={platform.id} className="space-y-2">
              <Label htmlFor={platform.id} className="text-base font-semibold flex items-center gap-2">
                {Icon && <Icon className={`w-4 h-4 ${platform.color}`} />}
                {platform.label}
              </Label>
              <Input
                id={platform.id}
                type="url"
                value={data[platform.id as keyof typeof data] as string || ''}
                onChange={(e) => onChange(platform.id, e.target.value)}
                placeholder={platform.placeholder}
                className={errors?.[platform.id] ? 'border-red-500' : ''}
              />
              {errors?.[platform.id] && (
                <p className="text-sm text-red-500">{errors[platform.id]}</p>
              )}
            </div>
          )
        })}

        {/* Help Text */}
        {mode === 'advisor' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Adding social media links helps build trust with families. They can see your content, client testimonials, and hockey expertise.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
