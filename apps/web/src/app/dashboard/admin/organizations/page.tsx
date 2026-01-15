'use client'

import { useAllOrganizations } from '@/domains/organization/hooks'
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
import { Building2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminOrganizationsPage() {
  const { data, isLoading, error } = useAllOrganizations({
    pagination: { limit: 50, offset: 0 },
    sorting: { sortBy: 'createdAt', sortDirection: 'desc' }
  })

  const organizations = data?.data ?? []
  const total = data?.meta.total ?? 0

  // Debug logging
  console.log('Admin Organizations Debug:', {
    total,
    organizationsLength: organizations.length,
    organizations: organizations.map(o => ({ id: o.id, name: o.name, slug: o.slug })),
    rawData: data,
  })

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Organizations Management</h1>
        <p className="text-muted-foreground">
          Admin panel for managing all organizations in the system.
        </p>
      </div>

      {/* Organizations Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            {total} organization{total !== 1 ? 's' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-4">
              <p className="font-medium">Error loading organizations</p>
              <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          )}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : organizations.length > 0 ? (
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
                    <TableCell className="text-muted-foreground">@{org.slug}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/organizations/${org.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No organizations found in the system
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
