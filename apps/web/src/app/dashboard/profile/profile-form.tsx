'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, authClient } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { Label } from '@repo/ui/components/shadcn/label'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Separator } from '@repo/ui/components/shadcn/separator'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Camera,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Session } from '@repo/auth'

function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface ProfileFormProps {
  initialSession: Session | null
}

/**
 * Profile form client component
 * Session is already hydrated from parent SessionRoute - reads from cache
 */
export function ProfileForm({ initialSession }: ProfileFormProps) {
  // Read session from cache - instantly available without loading state
  const { data: session, refetch } = useSession()
  const currentSession = session ?? initialSession
  
  const [name, setName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Get user name from session - session data can be null when not authenticated
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const userName = currentSession?.user?.name ?? ''
  
  // Initialize name when session loads
  useEffect(() => {
    if (userName !== '' && !isEditing) {
      setName(userName)
    }
  }, [userName, isEditing])
  
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    
    setIsUpdating(true)
    try {
      const result = await authClient.updateUser({ name: name.trim() })
      if (result.error) {
        throw new Error(result.error.message ?? 'Failed to update profile')
      }
      toast.success('Profile updated successfully')
      setIsEditing(false)
      // Refetch session to get updated user data
      await refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setIsUpdating(false)
    }
  }, [name, refetch])
  
  const handleCancel = useCallback(() => {
    setName(userName)
    setIsEditing(false)
  }, [userName])
  
  if (!currentSession?.user) {
    return null // Parent route already handles auth
  }
  
  const user = currentSession.user
  const isAdmin = user.role === 'admin' || user.role === 'superAdmin'

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                disabled
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
              <h3 className="text-xl font-semibold">{user.name ?? 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {user.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                  </Badge>
                )}
                {user.emailVerified && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Edit Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!isEditing) setIsEditing(true)
                  }}
                  placeholder="Enter your name"
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Button onClick={() => void handleSave()} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Your account information and status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">User ID</p>
              <p className="text-xs text-muted-foreground font-mono">
                {user.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Email Status</p>
              <p className="text-xs text-muted-foreground">
                {user.emailVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role ?? 'User'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
