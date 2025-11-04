'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle,
  Upload,
} from 'lucide-react'
import Image from 'next/image'
import TeamMemberDialog from '@/components/dashboard/TeamMemberDialog'

interface TeamMember {
  id: string
  name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  linkedin_url: string | null
  email: string | null
  phone: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/advisor/team')

      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }

      const data = await response.json()
      setTeamMembers(data.teamMembers || [])
    } catch (err) {
      console.error('Error fetching team members:', err)
      setError('Failed to load team members. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingMember(null)
    setDialogOpen(true)
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setDialogOpen(true)
  }

  const handleDelete = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) {
      return
    }

    setDeleting(memberId)
    setError(null)

    try {
      const response = await fetch(`/api/advisor/team/${memberId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete team member')
      }

      setSuccess('Team member deleted successfully')
      setTimeout(() => setSuccess(null), 3000)
      await fetchTeamMembers()
    } catch (err) {
      console.error('Error deleting team member:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete team member')
    } finally {
      setDeleting(null)
    }
  }

  const handleDialogClose = (shouldRefresh: boolean) => {
    setDialogOpen(false)
    setEditingMember(null)
    if (shouldRefresh) {
      fetchTeamMembers()
      setSuccess(editingMember ? 'Team member updated successfully' : 'Team member added successfully')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading team members...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Team Members
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your team and showcase your expertise
              </p>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Team Members List */}
        {teamMembers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Team Members Yet</h3>
              <p className="text-gray-600 mb-6">
                Add team members to showcase your organization's expertise and build trust with families.
              </p>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Team Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <Card key={member.id} className={!member.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  {/* Photo */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                      {member.photo_url ? (
                        <Image
                          src={member.photo_url}
                          alt={member.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                          <span className="text-4xl font-bold text-blue-600">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    {member.title && (
                      <p className="text-sm text-gray-600">{member.title}</p>
                    )}
                    {!member.is_active && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  {member.bio && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {member.bio}
                    </p>
                  )}

                  {/* Contact Info */}
                  {(member.email || member.phone || member.linkedin_url) && (
                    <div className="mb-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
                      {member.email && (
                        <div className="text-gray-600 truncate">{member.email}</div>
                      )}
                      {member.phone && (
                        <div className="text-gray-600">{member.phone}</div>
                      )}
                      {member.linkedin_url && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block truncate"
                        >
                          LinkedIn Profile
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                      disabled={deleting === member.id}
                    >
                      {deleting === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Team Member Dialog */}
        <TeamMemberDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          member={editingMember}
        />
      </div>
    </div>
  )
}
