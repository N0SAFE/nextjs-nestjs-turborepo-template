'use client'

import { useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/shadcn/card'

export default function InvitesPage() {
  const params = useParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const organizationId = params.organizationId as string

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Invitations</h1>
        <p className="text-muted-foreground mt-2">Manage pending member invitations</p>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No pending invitations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
