'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { AuthDashboardOrganizationsOrganizationIdMembers } from '@/routes'
import { useParams } from '@/routes/hooks'
import { RequireOrganizationRole } from '@/components/auth'
import { useState } from 'react'
import {
  useOrganizationMembers,
  useInviteOrganizationMember,
  useRemoveOrganizationMember,
  type OrganizationRole,
} from '@/domains/organization/hooks'

export default function MembersPage() {
  const params = useParams(AuthDashboardOrganizationsOrganizationIdMembers)
  const organizationId = params.organizationId
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedRole] = useState<OrganizationRole>('member')

  // Fetch members
  const { data: membersData, isLoading } = useOrganizationMembers(organizationId)
  const members = membersData?.members ?? []

  // Mutations
  const inviteMutation = useInviteOrganizationMember()
  const removeMutation = useRemoveOrganizationMember()

  const handleInvite = () => {
    if (!inviteEmail) return
    inviteMutation.mutate(
      { organizationId, email: inviteEmail, role: selectedRole },
      {
        onSuccess: () => {
          setInviteEmail('')
        },
      }
    )
  }

  const handleRemove = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMutation.mutate({ organizationId, memberIdOrEmail: memberId })
    }
  }

  return (
    <RequireOrganizationRole
      organizationId={organizationId}
      roles={['owner', 'admin']}
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-gray-600 mt-2">You do not have permission to manage members in this organization.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Members</h1>
            <p className="text-gray-600 mt-2">Manage organization members and their roles</p>
            <p className="text-sm text-gray-500 mt-1">Organization: {organizationId}</p>
          </div>
        </div>

        {/* Invite Member Section */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>Add new members to your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => {setInviteEmail(e.target.value)}}
                className="flex-1"
              />
              <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending...' : 'Invite'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Members</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading...' : members.length === 0 ? 'No members' : `${String(members.length)} member(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600">Loading members...</p>
                </div>
              </div>
            ) : members.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600">No members yet</p>
                  <p className="text-sm text-gray-500 mt-1">Invite members to get started</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium">Joined</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{member.user.name}</td>
                        <td className="p-4 text-gray-600">{member.user.email}</td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {member.role}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleRemove(member.id)
                            }}
                            disabled={removeMutation.isPending}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireOrganizationRole>
  )
}
