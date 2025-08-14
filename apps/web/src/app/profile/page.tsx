'use client'

import React from 'react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Alert, AlertDescription } from '@repo/ui/components/shadcn/alert'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/ui/components/shadcn/dialog'
import { Label } from '@repo/ui/components/shadcn/label'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Separator } from '@repo/ui/components/shadcn/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/shadcn/tabs'
import { 
    Fingerprint, 
    Plus, 
    Trash2, 
    Edit, 
    Shield, 
    AlertCircle, 
    CheckCircle,
    Smartphone,
    Monitor,
    Key,
    Clock,
    Settings,
    Users,
    MapPin,
    Calendar,
    LogOut,
    Eye,
    EyeOff,
} from 'lucide-react'
import { authClient, useSession } from '@/lib/auth'
import { Spinner } from '@repo/ui/components/atomics/atoms/Icon'

type PasskeyData = Awaited<ReturnType<typeof authClient.passkey.listUserPasskeys>>['data']
type Passkey = NonNullable<PasskeyData>[number]

type SessionData = Awaited<ReturnType<typeof authClient.listSessions>>['data']
type SessionItem = NonNullable<SessionData>[number]

const ProfilePage: React.FC = () => {
    const { data: session } = useSession()
    
    // Passkey state
    const [passkeys, setPasskeys] = React.useState<Passkey[]>([])
    const [passkeyLoading, setPasskeyLoading] = React.useState(true)
    const [isAddingPasskey, setIsAddingPasskey] = React.useState(false)
    const [isPasskeyDeleteModalOpen, setIsPasskeyDeleteModalOpen] = React.useState(false)
    const [isPasskeyEditModalOpen, setIsPasskeyEditModalOpen] = React.useState(false)
    const [selectedPasskey, setSelectedPasskey] = React.useState<Passkey | null>(null)
    const [newPasskeyName, setNewPasskeyName] = React.useState('')
    const [editPasskeyName, setEditPasskeyName] = React.useState('')
    const [passkeySupported, setPasskeySupported] = React.useState(false)
    
    // Session state  
    const [sessions, setSessions] = React.useState<SessionItem[]>([])
    const [sessionLoading, setSessionLoading] = React.useState(true)
    const [isSessionDeleteModalOpen, setIsSessionDeleteModalOpen] = React.useState(false)
    const [selectedSession, setSelectedSession] = React.useState<SessionItem | null>(null)
    const [showSessionTokens, setShowSessionTokens] = React.useState<Record<string, boolean>>({})
    
    // Global state
    const [error, setError] = React.useState<string>('')
    const [success, setSuccess] = React.useState<string>('')

    // Check if passkey is supported
    React.useEffect(() => {
        if (typeof window !== 'undefined' && 'PublicKeyCredential' in window) {
            setPasskeySupported(true)
        }
    }, [])

    // Load user's passkeys
    const loadPasskeys = React.useCallback(async () => {
        if (!session?.user) {
            return
        }
        
        try {
            setPasskeyLoading(true)
            setError('')
            const result = await authClient.passkey.listUserPasskeys()
            if (result.error) {
                setError(result.error.message || 'Failed to load passkeys')
            } else {
                setPasskeys((result.data || []) as Passkey[])
            }
        } catch (err) {
            console.error('Error loading passkeys:', err)
            setError('Failed to load passkeys')
        } finally {
            setPasskeyLoading(false)
        }
    }, [session?.user])

    // Load user's sessions
    const loadSessions = React.useCallback(async () => {
        if (!session?.user) {
            return
        }
        
        try {
            setSessionLoading(true)
            setError('')
            const result = await authClient.listSessions()
            if (result.error) {
                setError(result.error.message || 'Failed to load sessions')
            } else {
                setSessions((result.data || []) as SessionItem[])
            }
        } catch (err) {
            console.error('Error loading sessions:', err)
            setError('Failed to load sessions')
        } finally {
            setSessionLoading(false)
        }
    }, [session?.user])

    React.useEffect(() => {
        loadPasskeys()
        loadSessions()
    }, [loadPasskeys, loadSessions])

    const handleAddPasskey = async () => {
        if (!passkeySupported || !session?.user) {
            return
        }
        
        setIsAddingPasskey(true)
        setError('')
        setSuccess('')
        
        try {
            const result = await authClient.passkey.addPasskey({
                name: newPasskeyName.trim() || `${getDeviceTypeName()} - ${new Date().toLocaleDateString()}`,
            })
            
            if (result?.error) {
                setError(result.error.message || 'Failed to add passkey')
            } else {
                setSuccess('Passkey added successfully!')
                setNewPasskeyName('')
                await loadPasskeys()
            }
        } catch (err) {
            console.error('Error adding passkey:', err)
            setError('Failed to add passkey. Please try again.')
        } finally {
            setIsAddingPasskey(false)
        }
    }

    const handleDeletePasskey = async () => {
        if (!selectedPasskey) {
            return
        }
        
        try {
            setError('')
            setSuccess('')
            const result = await authClient.passkey.deletePasskey({
                id: selectedPasskey.id,
            })
            
            if (result.error) {
                setError(result.error.message || 'Failed to delete passkey')
            } else {
                setSuccess('Passkey deleted successfully!')
                await loadPasskeys()
            }
        } catch (err) {
            console.error('Error deleting passkey:', err)
            setError('Failed to delete passkey')
        } finally {
            setIsPasskeyDeleteModalOpen(false)
            setSelectedPasskey(null)
        }
    }

    const handleEditPasskey = async () => {
        if (!selectedPasskey || !editPasskeyName.trim()) {
            return
        }
        
        try {
            setError('')
            setSuccess('')
            const result = await authClient.passkey.updatePasskey({
                id: selectedPasskey.id,
                name: editPasskeyName.trim(),
            })
            
            if (result.error) {
                setError(result.error.message || 'Failed to update passkey')
            } else {
                setSuccess('Passkey updated successfully!')
                await loadPasskeys()
            }
        } catch (err) {
            console.error('Error updating passkey:', err)
            setError('Failed to update passkey')
        } finally {
            setIsPasskeyEditModalOpen(false)
            setSelectedPasskey(null)
            setEditPasskeyName('')
        }
    }

    const handleRevokeSession = async () => {
        if (!selectedSession) {
            return
        }
        
        try {
            setError('')
            setSuccess('')
            const result = await authClient.revokeSession({
                token: selectedSession.token,
            })
            
            if (result.error) {
                setError(result.error.message || 'Failed to revoke session')
            } else {
                setSuccess('Session revoked successfully!')
                await loadSessions()
            }
        } catch (err) {
            console.error('Error revoking session:', err)
            setError('Failed to revoke session')
        } finally {
            setIsSessionDeleteModalOpen(false)
            setSelectedSession(null)
        }
    }

    const handleRevokeAllOtherSessions = async () => {
        try {
            setError('')
            setSuccess('')
            const result = await authClient.revokeOtherSessions()
            
            if (result.error) {
                setError(result.error.message || 'Failed to revoke other sessions')
            } else {
                setSuccess('All other sessions revoked successfully!')
                await loadSessions()
            }
        } catch (err) {
            console.error('Error revoking other sessions:', err)
            setError('Failed to revoke other sessions')
        }
    }

    const getDeviceTypeName = () => {
        if (typeof navigator !== 'undefined') {
            if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
                return 'Mobile Device'
            }
            return 'Desktop'
        }
        return 'Device'
    }

    const getDeviceIcon = (deviceType: string) => {
        if (deviceType.toLowerCase().includes('mobile') || deviceType.toLowerCase().includes('phone')) {
            return <Smartphone className="h-4 w-4" />
        }
        return <Monitor className="h-4 w-4" />
    }

    const getSessionDeviceIcon = (userAgent?: string) => {
        if (userAgent && (/Mobile|Android|iPhone|iPad/.test(userAgent))) {
            return <Smartphone className="h-4 w-4" />
        }
        return <Monitor className="h-4 w-4" />
    }

    const formatDate = (date: Date | string) => {
        const dateObj = date instanceof Date ? date : new Date(date)
        return dateObj.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getUserAgentInfo = (userAgent?: string) => {
        if (!userAgent) {
            return 'Unknown'
        }
        
        // Simple browser detection
        if (userAgent.includes('Chrome')) {
            return 'Chrome'
        }
        if (userAgent.includes('Firefox')) {
            return 'Firefox'
        }
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return 'Safari'
        }
        if (userAgent.includes('Edge')) {
            return 'Edge'
        }
        if (userAgent.includes('Opera')) {
            return 'Opera'
        }
        
        return 'Unknown Browser'
    }

    const getLocationInfo = (ipAddress?: string) => {
        // In a real app, you might want to do IP geolocation
        // For now, just show the IP or a placeholder
        return ipAddress || 'Unknown Location'
    }

    const isCurrentSession = (sessionToken: string) => {
        return session?.session.token === sessionToken
    }

    const toggleSessionToken = (sessionId: string) => {
        setShowSessionTokens(prev => ({
            ...prev,
            [sessionId]: !prev[sessionId]
        }))
    }

    const openPasskeyEditModal = (passkey: Passkey) => {
        setSelectedPasskey(passkey)
        setEditPasskeyName(passkey.name || '')
        setIsPasskeyEditModalOpen(true)
    }

    const openPasskeyDeleteModal = (passkey: Passkey) => {
        setSelectedPasskey(passkey)
        setIsPasskeyDeleteModalOpen(true)
    }

    const openSessionDeleteModal = (session: SessionItem) => {
        setSelectedSession(session)
        setIsSessionDeleteModalOpen(true)
    }

    if (!session?.user) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Please sign in to manage your profile</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Settings className="h-8 w-8" />
                        Profile & Security
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your account information, security settings, and active sessions
                    </p>
                </div>

                {/* User Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p><strong>Name:</strong> {session.user.name}</p>
                                <p><strong>Email:</strong> {session.user.email}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="flex items-center gap-2">
                                    <strong>Email Verified:</strong> 
                                    {session.user.emailVerified ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-orange-500" />
                                    )}
                                    {session.user.emailVerified ? 'Yes' : 'No'}
                                </p>
                                <p><strong>User ID:</strong> {session.user.id}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {/* Security Management Tabs */}
                <Tabs defaultValue="sessions" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sessions" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Active Sessions
                        </TabsTrigger>
                        <TabsTrigger value="passkeys" className="flex items-center gap-2">
                            <Fingerprint className="h-4 w-4" />
                            Passkeys
                        </TabsTrigger>
                    </TabsList>

                    {/* Sessions Tab */}
                    <TabsContent value="sessions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Active Sessions
                                        </CardTitle>
                                        <CardDescription>
                                            Manage your active sessions across all devices
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={handleRevokeAllOtherSessions}
                                        className="flex items-center gap-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Revoke All Others
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {sessionLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner />
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            No active sessions found
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {sessions.map((sessionItem, index) => (
                                            <div key={sessionItem.id}>
                                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            {getSessionDeviceIcon(sessionItem.userAgent)}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-medium">
                                                                        {getUserAgentInfo(sessionItem.userAgent)}
                                                                    </h4>
                                                                    {isCurrentSession(sessionItem.token) && (
                                                                        <Badge variant="default">Current</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {getLocationInfo(sessionItem.ipAddress)}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="h-3 w-3" />
                                                                        Created: {formatDate(sessionItem.createdAt)}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="h-3 w-3" />
                                                                        Expires: {formatDate(sessionItem.expiresAt)}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Key className="h-3 w-3" />
                                                                        <span>Token:</span>
                                                                        <button
                                                                            onClick={() => toggleSessionToken(sessionItem.id)}
                                                                            className="flex items-center gap-1 text-xs hover:text-foreground"
                                                                        >
                                                                            {showSessionTokens[sessionItem.id] ? (
                                                                                <>
                                                                                    <EyeOff className="h-3 w-3" />
                                                                                    <span className="font-mono">
                                                                                        {sessionItem.token.slice(0, 8)}...{sessionItem.token.slice(-8)}
                                                                                    </span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Eye className="h-3 w-3" />
                                                                                    <span>••••••••</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {!isCurrentSession(sessionItem.token) && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => openSessionDeleteModal(sessionItem)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                {index < sessions.length - 1 && <Separator className="my-2" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Passkeys Tab */}
                    <TabsContent value="passkeys" className="space-y-6">
                        {/* Passkey Support Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Passkey Support
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    {passkeySupported ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="text-green-700 dark:text-green-400">
                                                Your browser supports passkeys
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-5 w-5 text-orange-500" />
                                            <span className="text-orange-700 dark:text-orange-400">
                                                Your browser doesn&apos;t support passkeys
                                            </span>
                                        </>
                                    )}
                                </div>
                                {!passkeySupported && (
                                    <p className="text-muted-foreground text-sm mt-2">
                                        Please use a modern browser like Chrome, Safari, or Firefox to use passkeys.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Add Passkey Section */}
                        {passkeySupported && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Plus className="h-5 w-5" />
                                        Add New Passkey
                                    </CardTitle>
                                    <CardDescription>
                                        Create a new passkey for this device to enable passwordless login
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <Label htmlFor="passkey-name">Passkey Name (Optional)</Label>
                                                <Input
                                                    id="passkey-name"
                                                    placeholder={`${getDeviceTypeName()} - ${new Date().toLocaleDateString()}`}
                                                    value={newPasskeyName}
                                                    onChange={(e) => setNewPasskeyName(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    onClick={handleAddPasskey}
                                                    disabled={isAddingPasskey}
                                                    className="flex items-center gap-2"
                                                >
                                                    {isAddingPasskey ? (
                                                        <Spinner />
                                                    ) : (
                                                        <Fingerprint className="h-4 w-4" />
                                                    )}
                                                    Add Passkey
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Passkeys List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Fingerprint className="h-5 w-5" />
                                    Your Passkeys
                                </CardTitle>
                                <CardDescription>
                                    Manage your registered passkeys
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {passkeyLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner />
                                    </div>
                                ) : passkeys.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Fingerprint className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            No passkeys registered yet
                                        </p>
                                        {passkeySupported && (
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Add your first passkey above to get started
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {passkeys.map((passkey, index) => (
                                            <div key={passkey.id}>
                                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            {getDeviceIcon(passkey.deviceType)}
                                                            <div>
                                                                <h4 className="font-medium">
                                                                    {passkey.name || 'Unnamed Passkey'}
                                                                </h4>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    {formatDate(passkey.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Badge variant={passkey.backedUp ? "default" : "secondary"}>
                                                                {passkey.backedUp ? "Synced" : "Local"}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                {passkey.deviceType}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openPasskeyEditModal(passkey)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => openPasskeyDeleteModal(passkey)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {index < passkeys.length - 1 && <Separator className="my-2" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Session Delete Dialog */}
            <Dialog open={isSessionDeleteModalOpen} onOpenChange={setIsSessionDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke Session</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke this session? The user will be signed out from this device.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                            {selectedSession && getSessionDeviceIcon(selectedSession.userAgent)}
                            <div>
                                <p className="font-medium">
                                    {selectedSession && getUserAgentInfo(selectedSession.userAgent)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedSession && getLocationInfo(selectedSession.ipAddress)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedSession && formatDate(selectedSession.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsSessionDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRevokeSession}
                        >
                            Revoke Session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Passkey Dialog */}
            <Dialog open={isPasskeyEditModalOpen} onOpenChange={setIsPasskeyEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Passkey</DialogTitle>
                        <DialogDescription>
                            Update the name of your passkey
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-passkey-name">Passkey Name</Label>
                            <Input
                                id="edit-passkey-name"
                                value={editPasskeyName}
                                onChange={(e) => setEditPasskeyName(e.target.value)}
                                placeholder="Enter a name for this passkey"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsPasskeyEditModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditPasskey}
                            disabled={!editPasskeyName.trim()}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Passkey Dialog */}
            <Dialog open={isPasskeyDeleteModalOpen} onOpenChange={setIsPasskeyDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Passkey</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this passkey? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                            {selectedPasskey && getDeviceIcon(selectedPasskey.deviceType)}
                            <div>
                                <p className="font-medium">
                                    {selectedPasskey?.name || 'Unnamed Passkey'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedPasskey && formatDate(selectedPasskey.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsPasskeyDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeletePasskey}
                        >
                            Delete Passkey
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ProfilePage
