'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { useOrganizations, type Organization } from '@/domains/organization/hooks'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import { AuthDashboardOrganizationsNew, AuthDashboardOrganizationsOrganizationId } from '@/routes'

export default function OrganizationsPage() {
  const { data, isLoading, error } = useOrganizations({ pagination: { page: 1, pageSize: 20 } })
  
  // Better Auth returns Organization[] directly
  const organizations: Organization[] = data ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organizations and memberships
          </p>
        </div>
        <AuthDashboardOrganizationsNew.Link>
          <Button>Create Organization</Button>
        </AuthDashboardOrganizationsNew.Link>
      </div>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Organizations</CardTitle>
          {organizations.length > 0 && (
            <CardDescription>
              You are a member of {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i: number) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-600">Failed to load organizations</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No organizations yet</p>
                <AuthDashboardOrganizationsNew.Link>
                  <Button>Create your first organization</Button>
                </AuthDashboardOrganizationsNew.Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {organizations.map((org) => (
                <AuthDashboardOrganizationsOrganizationId.Link
                  key={org.id}
                  organizationId={org.id}
                  className="block group"
                >
                  <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {org.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(org.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{org.slug || 'No slug'}</p>
                      </div>
                    </div>
                  </div>
                </AuthDashboardOrganizationsOrganizationId.Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
