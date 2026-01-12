'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui/components/shadcn/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/shadcn/tabs'
import { Button } from '@repo/ui/components/shadcn/button'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { AuthDashboardOrganizationsOrganizationId, AuthDashboardOrganizationsOrganizationIdMembers, AuthDashboardOrganizationsOrganizationIdSettings } from '@/routes'
import { useParams } from '@/routes/hooks'
import { useOrganization, useOrganizationMembers } from '@/hooks/useOrganization'

export default function OrganizationDetailPage() {
  const params = useParams(AuthDashboardOrganizationsOrganizationId)
  const organizationId = params.organizationId

  const { data: organization, isLoading: isLoadingOrg, error: orgError } = useOrganization(organizationId)
  const { data: membersData, isLoading: isLoadingMembers } = useOrganizationMembers(organizationId)
  
  // Better Auth returns { members: Member[], total: number }
  const members = membersData?.members ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLoadingOrg ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              organization?.name ?? 'Organization Details'
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            {organization?.slug ? `@${organization.slug}` : 'Manage organization settings and members'}
          </p>
        </div>
        <div className="flex gap-2">
          <AuthDashboardOrganizationsOrganizationIdSettings.Link organizationId={organizationId}>
            <Button variant="outline">Settings</Button>
          </AuthDashboardOrganizationsOrganizationIdSettings.Link>

              {/* Error State */}
              {orgError && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <p className="text-destructive">
                      Failed to load organization: {orgError instanceof Error ? orgError.message : 'Unknown error'}
                    </p>
                  </CardContent>
                </Card>
              )}
        </div>
      </div>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
                  <CardDescription>
                    Created on {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : '-'}
                  </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingOrg ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
                <p className="text-lg font-mono">{organizationId}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">
                    {organization?.name ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="text-lg font-mono">{organization?.slug ?? 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Members</label>
                  <p className="text-lg font-semibold">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Members, Invites, Settings */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Members ({isLoadingMembers ? '...' : members.length})</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>People who have access to this organization</CardDescription>
                </div>
                <AuthDashboardOrganizationsOrganizationIdMembers.Link organizationId={organizationId}>
                  <Button size="sm">Manage Members</Button>
                </AuthDashboardOrganizationsOrganizationIdMembers.Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No members yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.slice(0, 5).map((member: typeof members[number]) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  ))}
                  {members.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      And {members.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
                          <CardDescription>Members who have been invited but haven&apos;t joined yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No pending invitations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
                          <CardDescription>Configure organization preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <AuthDashboardOrganizationsOrganizationIdSettings.Link organizationId={organizationId}>
                <Button>Go to Settings</Button>
              </AuthDashboardOrganizationsOrganizationIdSettings.Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
