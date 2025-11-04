'use client'

import { Phone, Mail, User, Linkedin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export interface TeamMember {
  id: string
  name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  phone: string | null
  email: string | null
  linkedin_url: string | null
  display_order: number
}

interface TeamSectionProps {
  teamMembers: TeamMember[]
}

export function TeamSection({ teamMembers }: TeamSectionProps) {
  if (!teamMembers || teamMembers.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meet Our Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
            >
              {/* Photo */}
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-50">
                  {member.photo_url ? (
                    <Image
                      src={member.photo_url}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <span className="text-2xl font-bold text-blue-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  {member.name}
                </h3>
                {member.title && (
                  <p className="text-sm text-gray-600 mb-2">{member.title}</p>
                )}
              </div>

              {member.bio && (
                <p className="text-sm text-gray-700 mb-4 text-center line-clamp-3">
                  {member.bio}
                </p>
              )}

              {/* Contact Info */}
              {(member.phone || member.email || member.linkedin_url) && (
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{member.phone}</span>
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  )}
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">LinkedIn Profile</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
