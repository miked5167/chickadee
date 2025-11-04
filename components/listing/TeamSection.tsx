'use client'

import { Phone, Mail, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface TeamMember {
  name: string
  phone: string
  email: string
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
        <CardTitle>Our Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-hockey-blue transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-hockey-blue/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-hockey-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <div className="space-y-1">
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-hockey-blue transition-colors"
                      >
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{member.phone}</span>
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-hockey-blue transition-colors"
                      >
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
