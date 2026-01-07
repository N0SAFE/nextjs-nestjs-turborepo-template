'use client'

import { useState } from 'react'
import { useAdminListUsers, useAdminActions } from '@/hooks/useAdmin'
import { Button } from '@repo/ui/components/shadcn/button'
import { Badge } from '@repo/ui/components/shadcn/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/shadcn/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/shadcn/dialog'
import { Input } from '@repo/ui/components/shadcn/input'
import { Label } from '@repo/ui/components/shadcn/label'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import { Ban, ShieldCheck, UserX, RefreshCw } from 'lucide-react'

export default function AdminUsersPage() {
  const [page, setPage] = useState(0)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')
  
  const pageSize = 20
  
  const { data: usersData, isLoading, refetch } = useAdminListUsers({
    limit: pageSize,
    offset: page * pageSize,
  })
  
  const { 
    banUser, 
    unbanUser, 
    setRole, 
    removeUser,
    isLoading: actionLoading,
  } = useAdminActions()

  const handleRoleChange = (userId: string, role: 'user' | 'admin') => {
    setRole({ userId, role })
  }

  const handleBanClick = (user: { id: string; name: string }) => {
    setSelectedUser(user)
    setBanDialogOpen(true)
    setBanReason('')
    setBanDuration('')
  }

  const handleBanConfirm = () => {
    if (!selectedUser) return
    
    const expiresIn = banDuration ? parseInt(banDuration) * 24 * 60 * 60 : undefined
    
    banUser({
      userId: selectedUser.id,
      banReason: banReason.trim() ? banReason : undefined,
      banExpiresIn: expiresIn,
    })
    
    setBanDialogOpen(false)
    setSelectedUser(null)
  }

  const handleUnban = (userId: string) => {
    unbanUser({ userId })
  }

  const handleRemove = (userId: string) => {
    if (confirm('Are you sure you want to permanently remove this user? This action cannot be undone.')) {
      removeUser({ userId })
    }
  }

  const users = usersData?.users ?? []
  const hasNextPage = users.length === pageSize

  if (isLoading && page === 0) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users, roles, and access permissions
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            void refetch()
          }}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all users registered on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role ?? 'user'}
                        onValueChange={(role) => {
                          handleRoleChange(user.id, role as 'user' | 'admin')
                        }}
                        disabled={actionLoading.setRole}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superAdmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <ShieldCheck className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.banned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleUnban(user.id)
                            }}
                            disabled={actionLoading.unban}
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleBanClick({ id: user.id, name: user.name })
                            }}
                            disabled={actionLoading.ban}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            handleRemove(user.id)
                          }}
                          disabled={actionLoading.remove}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1} to {page * pageSize + users.length} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage(p => Math.max(0, p - 1))
                }}
                disabled={page === 0 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage(p => p + 1)
                }}
                disabled={!hasNextPage || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {selectedUser?.name} from accessing the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="banReason">Reason (optional)</Label>
              <Input
                id="banReason"
                placeholder="e.g., Violation of terms of service"
                value={banReason}
                onChange={(e) => {
                  setBanReason(e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banDuration">Duration in days (optional)</Label>
              <Input
                id="banDuration"
                type="number"
                placeholder="Leave empty for permanent ban"
                value={banDuration}
                onChange={(e) => {
                  setBanDuration(e.target.value)
                }}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for a permanent ban
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanConfirm}
              disabled={actionLoading.ban}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
