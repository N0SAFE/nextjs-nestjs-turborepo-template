'use client'

import { useOrganizations } from '@/hooks/useOrganization'
import { useAllInvitations } from '@/hooks/useInvitation'
import { useUsers } from '@/hooks/useUsers'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/shadcn/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/shadcn/table'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Building2, Users, Mail, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function AdminSystemPage() {
  const { data: organizations, isLoading: orgsLoading } = useOrganizations()
  const { data: invitations, isLoading: invitesLoading } = useAllInvitations()
  const { data: usersData, isLoading: usersLoading } = useUsers()

  const users = usersData?.data ?? []
  const pendingInvitations = invitations?.filter(inv => inv.status === 'pending') ?? []

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all organizations, users, and invitations in the system.
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{users.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{organizations?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Total Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{invitations?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{pendingInvitations.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            {organizations?.length ?? 0} organization{organizations?.length !== 1 ? 's' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : organizations && organizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {org.logo ? (
                          <Image src={org.logo} alt={org.name} width={24} height={24} className="h-6 w-6 rounded" />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                        {org.name}
                      </div>
                    </TableCell>
                    <TableCell>@{org.slug}</TableCell>
                    <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <a
                        href={`/dashboard/organizations/${org.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Details
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No organizations yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Table */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>{invitation.organizationId}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invitation.status === 'pending'
                            ? 'default'
                            : invitation.status === 'accepted'
                            ? 'success'
                            : 'destructive'
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>
            Latest {Math.min(users.length, 10)} users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.slice(0, 10).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.image ? (
                          <Image src={user.image} alt={user.name} width={24} height={24} className="h-6 w-6 rounded-full" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                            {user.name[0]?.toUpperCase()}
                          </div>
                        )}
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.banned ? 'destructive' : 'outline'}
                        className={user.banned ? '' : 'border-green-500 text-green-600'}
                      >
                        {user.banned ? 'Banned' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
