'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FIELD_LIMITS } from '@/lib/constants/profile-fields'
import { ProfileSectionProps, TeamMember } from '@/types/advisor'
import { Users, Plus, Trash2, ArrowUp, ArrowDown, Mail, Phone, User, Briefcase } from 'lucide-react'
import { useState } from 'react'

export function TeamMembersSection({ data, onChange, errors, mode = 'advisor' }: ProfileSectionProps) {
  const teamMembers = (data.team_members as TeamMember[]) || []
  const [expandedMember, setExpandedMember] = useState<number | null>(null)

  const addTeamMember = () => {
    if (teamMembers.length >= FIELD_LIMITS.MAX_TEAM_MEMBERS) return

    const newMember: TeamMember = {
      id: `temp-${Date.now()}`,
      name: '',
      title: '',
      bio: '',
      email: '',
      phone: '',
      display_order: teamMembers.length,
      is_active: true
    }

    onChange('team_members', [...teamMembers, newMember])
    setExpandedMember(teamMembers.length)
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    const updated = [...teamMembers]
    updated[index] = { ...updated[index], [field]: value }
    onChange('team_members', updated)
  }

  const deleteTeamMember = (index: number) => {
    const updated = teamMembers.filter((_, i) => i !== index)
    // Reorder remaining members
    const reordered = updated.map((member, i) => ({ ...member, display_order: i }))
    onChange('team_members', reordered)
    if (expandedMember === index) {
      setExpandedMember(null)
    }
  }

  const moveTeamMemberUp = (index: number) => {
    if (index === 0) return
    const updated = [...teamMembers]
    const temp = updated[index - 1]
    updated[index - 1] = { ...updated[index], display_order: index - 1 }
    updated[index] = { ...temp, display_order: index }
    onChange('team_members', updated)

    // Update expanded state if needed
    if (expandedMember === index) {
      setExpandedMember(index - 1)
    } else if (expandedMember === index - 1) {
      setExpandedMember(index)
    }
  }

  const moveTeamMemberDown = (index: number) => {
    if (index === teamMembers.length - 1) return
    const updated = [...teamMembers]
    const temp = updated[index + 1]
    updated[index + 1] = { ...updated[index], display_order: index + 1 }
    updated[index] = { ...temp, display_order: index }
    onChange('team_members', updated)

    // Update expanded state if needed
    if (expandedMember === index) {
      setExpandedMember(index + 1)
    } else if (expandedMember === index + 1) {
      setExpandedMember(index)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          {mode === 'advisor'
            ? 'Add team members who work with you. This helps families know who they might interact with.'
            : 'Advisor team members'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header with count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <p className="text-sm text-gray-600">
              {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
              {teamMembers.length > 0 && ` (max ${FIELD_LIMITS.MAX_TEAM_MEMBERS})`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTeamMember}
            disabled={teamMembers.length >= FIELD_LIMITS.MAX_TEAM_MEMBERS}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </Button>
        </div>

        {/* Team Members List */}
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-4">No team members added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTeamMember}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Team Member
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member, index) => {
              const isExpanded = expandedMember === index
              const bioLength = member.bio?.length || 0

              return (
                <div
                  key={member.id || index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gray-50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveTeamMemberUp(index)}
                          disabled={index === 0}
                          className="h-5 w-5 p-0"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveTeamMemberDown(index)}
                          disabled={index === teamMembers.length - 1}
                          className="h-5 w-5 p-0"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {member.name || `Team Member ${index + 1}`}
                        </p>
                        {member.title && (
                          <p className="text-xs text-gray-600">{member.title}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedMember(isExpanded ? null : index)}
                      >
                        {isExpanded ? 'Collapse' : 'Edit'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTeamMember(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Form */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-white">
                      {/* Name and Title - Two Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`member-${index}-name`} className="text-sm font-semibold flex items-center gap-2">
                            <User className="w-3 h-3" />
                            Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`member-${index}-name`}
                            value={member.name || ''}
                            onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                            placeholder="John Smith"
                            className="text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`member-${index}-title`} className="text-sm font-semibold flex items-center gap-2">
                            <Briefcase className="w-3 h-3" />
                            Title/Role <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`member-${index}-title`}
                            value={member.title || ''}
                            onChange={(e) => updateTeamMember(index, 'title', e.target.value)}
                            placeholder="e.g., Senior Advisor, Recruiting Specialist"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <Label htmlFor={`member-${index}-bio`} className="text-sm font-semibold">
                          Bio <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id={`member-${index}-bio`}
                          value={member.bio || ''}
                          onChange={(e) => updateTeamMember(index, 'bio', e.target.value)}
                          placeholder="Brief bio highlighting experience and expertise..."
                          rows={3}
                          maxLength={FIELD_LIMITS.MAX_TEAM_MEMBER_BIO_LENGTH}
                          className="text-sm"
                        />
                        <p className={`text-xs ${bioLength >= FIELD_LIMITS.MAX_TEAM_MEMBER_BIO_LENGTH ? 'text-red-500' : 'text-gray-500'}`}>
                          {bioLength} / {FIELD_LIMITS.MAX_TEAM_MEMBER_BIO_LENGTH} characters
                        </p>
                      </div>

                      {/* Email and Phone - Two Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`member-${index}-email`} className="text-sm font-semibold flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            Email
                          </Label>
                          <Input
                            id={`member-${index}-email`}
                            type="email"
                            value={member.email || ''}
                            onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                            placeholder="john@example.com"
                            className="text-sm"
                          />
                          <p className="text-xs text-gray-500">Optional</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`member-${index}-phone`} className="text-sm font-semibold flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            Phone
                          </Label>
                          <Input
                            id={`member-${index}-phone`}
                            type="tel"
                            value={member.phone || ''}
                            onChange={(e) => updateTeamMember(index, 'phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="text-sm"
                          />
                          <p className="text-xs text-gray-500">Optional</p>
                        </div>
                      </div>

                      {/* Photo URL */}
                      <div className="space-y-2">
                        <Label htmlFor={`member-${index}-photo`} className="text-sm font-semibold">
                          Photo URL
                        </Label>
                        <Input
                          id={`member-${index}-photo`}
                          type="url"
                          value={member.photo_url || ''}
                          onChange={(e) => updateTeamMember(index, 'photo_url', e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          Optional. Direct URL to team member's headshot photo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {errors?.team_members && (
          <p className="text-sm text-red-500">{errors.team_members}</p>
        )}

        {/* Help Text */}
        {mode === 'advisor' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Adding team members builds trust and helps families understand who they'll be working with. Include photos and detailed bios when possible.
            </p>
          </div>
        )}

        {teamMembers.length >= FIELD_LIMITS.MAX_TEAM_MEMBERS && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              You've reached the maximum of {FIELD_LIMITS.MAX_TEAM_MEMBERS} team members.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
