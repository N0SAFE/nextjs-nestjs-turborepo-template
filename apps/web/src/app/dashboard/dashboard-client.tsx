'use client'

import { useOrganizations, useAllOrganizationPendingInvitations } from '@/domains/organization/hooks'
import { useAcceptInvitation, useRejectInvitation } from '@/domains/invitation/hooks'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import { Building2, Mail, CheckCircle2, XCircle, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface DashboardOverviewClientProps {
  isAdmin: boolean
  userRole: string
}

/**
 * Client component for dashboard interactivity
 * Fetches and displays real organization and invitation data
 */
export function DashboardOverviewClient({ isAdmin, userRole }: DashboardOverviewClientProps) {
  const { data: organizations, isLoading: orgsLoading } = useOrganizations()
  const { data: invitations, isLoading: invitesLoading } = useAllOrganizationPendingInvitations()
  const acceptInvitation = useAcceptInvitation()
  const rejectInvitation = useRejectInvitation()

  const handleAcceptInvite = (invitationId: string) => {
    acceptInvitation.mutate({ invitationId })
  }

  const handleRejectInvite = (invitationId: string) => {
    rejectInvitation.mutate({ invitationId })
  }

  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{organizations?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Organizations you belong to
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitesLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{invitations?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting your acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userRole}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform permission level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {invitation.organizationId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Role: {invitation.role} • Expires:{' '}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {handleAcceptInvite(invitation.id)}}
                      disabled={acceptInvitation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {handleRejectInvite(invitation.id)}}
                      disabled={rejectInvitation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations List */}
      {organizations && organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Organizations</CardTitle>
            <CardDescription>
              Organizations you are a member of
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {organizations.map((org) => (
                <Link
                  key={org.id}
                  href={`/dashboard/organizations/${org.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {org.logo ? (
                      <Image
                        src={org.logo}
                        alt={org.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">@{org.slug}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View →
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/organizations/new">
                <Building2 className="h-4 w-4 mr-2" />
                Create Organization
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/organizations">
                <Users className="h-4 w-4 mr-2" />
                View All Organizations
              </Link>
            </Button>
            {isAdmin && (
              <>
                <Button asChild variant="outline">
                  <Link href="/dashboard/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/admin/system">
                    <Users className="h-4 w-4 mr-2" />
                    System Dashboard
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
