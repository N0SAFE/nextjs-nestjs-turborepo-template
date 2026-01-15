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
import { AuthDashboardOrganizationsOrganizationIdSettings } from '@/routes'
import { useParams } from '@/routes/hooks'
import { RequireOrganizationRole } from '@/components/auth'
import { useState } from 'react'
import {
  useOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
} from '@/domains/organization/hooks'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const params = useParams(AuthDashboardOrganizationsOrganizationIdSettings)
  const organizationId = params.organizationId
  const router = useRouter()

  // Fetch organization data
  const { data: organization } = useOrganization(organizationId)

  // Mutations
  const updateMutation = useUpdateOrganization()
  const deleteMutation = useDeleteOrganization()

  // Form state derived from organization data
  const [name, setName] = useState(organization?.name ?? '')
  const [slug, setSlug] = useState(organization?.slug ?? '')

  const handleSave = () => {
    updateMutation.mutate({
      organizationId,
      name,
      slug: slug || undefined,
    })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      deleteMutation.mutate(
        { organizationId },
        {
          onSuccess: () => {
            router.push('/dashboard/organizations')
          },
        }
      )
    }
  }

  return (
    <RequireOrganizationRole
      organizationId={organizationId}
      roles={['owner', 'admin']}
      minimumRole="admin"
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-gray-600 mt-2">You need admin role to manage organization settings.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-600 mt-2">Manage organization settings</p>
          <p className="text-sm text-gray-500 mt-1">Organization: {organizationId}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Organization Name</label>
                <Input
                  value={name}
                  onChange={(e) => {setName(e.target.value)}}
                  placeholder="My Organization"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => {setSlug(e.target.value)}}
                  placeholder="my-organization"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Used in URLs and API routes</p>
              </div>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Organization Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>Control who can discover this organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="visibility" value="private" defaultChecked className="w-4 h-4" />
                  <div>
                    <div className="font-medium text-sm">Private</div>
                    <p className="text-xs text-gray-600">Only members can see</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="visibility" value="public" className="w-4 h-4" />
                  <div>
                    <div className="font-medium text-sm">Public</div>
                    <p className="text-xs text-gray-600">Anyone can discover</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="md:col-span-2 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Deleting your organization will permanently remove all data including members, invites, and projects.
              </p>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Organization'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireOrganizationRole>
  )
}
