"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Separator } from "@repo/ui/components/shadcn/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import {
  Trash2,
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
  Bell,
  UserCircle,
  Mail,
  ShieldAlert,
  Activity,
  Link2,
  Timer,
  TrendingUp,
} from "lucide-react";
import { authClient, useSession } from "@/lib/auth";
import { Spinner } from "@repo/ui/components/atomics/atoms/Icon";
import { Session } from "better-auth";
import { PushNotificationSettings } from "@/components/push-notifications/PushNotificationSettings";
import { usePushStats } from "@/hooks/usePush";

const ProfilePage: React.FC = () => {
  const { data: session } = useSession();

  // Session state
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [sessionLoading, setSessionLoading] = React.useState(true);
  const [isSessionDeleteModalOpen, setIsSessionDeleteModalOpen] =
    React.useState(false);
  const [selectedSession, setSelectedSession] = React.useState<Session | null>(
    null,
  );
  const [showSessionTokens, setShowSessionTokens] = React.useState<
    Record<string, boolean>
  >({});
  // Get push notification stats
  const { data: pushStats } = usePushStats();
  // Global state
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");

  // Load user's sessions
  const loadSessions = React.useCallback(async () => {
    if (!session?.user) {
      return;
    }

    try {
      setSessionLoading(true);
      setError("");
      const result = await authClient.listSessions();
      if (result.error) {
        setError(result.error.message ?? "Failed to load sessions");
      } else {
        setSessions(result.data);
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError("Failed to load sessions");
    } finally {
      setSessionLoading(false);
    }
  }, [session?.user]);

  React.useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = async () => {
    if (!selectedSession) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const result = await authClient.revokeSession({
        token: selectedSession.token,
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to revoke session");
      } else {
        setSuccess("Session revoked successfully!");
        await loadSessions();
      }
    } catch (err) {
      console.error("Error revoking session:", err);
      setError("Failed to revoke session");
    } finally {
      setIsSessionDeleteModalOpen(false);
      setSelectedSession(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      setError("");
      setSuccess("");
      const result = await authClient.revokeOtherSessions();

      if (result.error) {
        setError(result.error.message ?? "Failed to revoke other sessions");
      } else {
        setSuccess("All other sessions revoked successfully!");
        await loadSessions();
      }
    } catch (err) {
      console.error("Error revoking other sessions:", err);
      setError("Failed to revoke other sessions");
    }
  };

  const getSessionDeviceIcon = (userAgent?: string | null) => {
    if (userAgent && /Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getLocationInfo = (ipAddress?: string | null) => {
    // In a real app, you might want to do IP geolocation
    return ipAddress ?? "Unknown Location";
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserAgentInfo = (userAgent?: string | null) => {
    if (!userAgent) {
      return "Unknown";
    }

    // Simple browser detection
    if (userAgent.includes("Chrome")) {
      return "Chrome";
    }
    if (userAgent.includes("Firefox")) {
      return "Firefox";
    }
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      return "Safari";
    }
    if (userAgent.includes("Edge")) {
      return "Edge";
    }
    if (userAgent.includes("Opera")) {
      return "Opera";
    }

    return "Unknown Browser";
  };

  const isCurrentSession = (sessionToken: string) => {
    return session?.session.token === sessionToken;
  };

  const toggleSessionToken = (sessionId: string) => {
    setShowSessionTokens((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const openSessionDeleteModal = (session: Session) => {
    setSelectedSession(session);
    setIsSessionDeleteModalOpen(true);
  };

  if (!session?.user) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Please sign in to manage your profile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
            Manage your account information, security settings, and active
            sessions
          </p>
        </div>

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

        {/* Tabbed Interface */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                      <p className="font-medium flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        {session.user.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {session.user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email Verification</p>
                      <div className="flex items-center gap-2">
                        {session.user.emailVerified ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-700 dark:text-green-400">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-700 dark:text-orange-400">Not Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">User ID</p>
                      <p className="font-mono text-sm bg-muted px-3 py-2 rounded">
                        {session.user.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Role</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {session.user.role ?? 'user'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Account Created</p>
                      <p className="font-medium">
                        {formatDate(session.user.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div>
                  <h3 className="font-semibold mb-3">Additional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {session.user.image && (
                      <div>
                        <p className="text-muted-foreground mb-1">Profile Image</p>
                        <div className="flex items-center gap-2">
                          <Image
                            src={session.user.image}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full"
                          />
                          <span className="text-xs text-muted-foreground">Linked</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground mb-1">Last Updated</p>
                      <p>{formatDate(session.user.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Account Statistics */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Account Activity
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Active Sessions</p>
                      </div>
                      <p className="text-2xl font-bold">{sessions.length}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Push Subscriptions</p>
                      </div>
                      <p className="text-2xl font-bold">{pushStats?.activeSubscriptions ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Account Age</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {Math.floor(
                          (new Date().getTime() - new Date(session.user.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}
                        <span className="text-sm font-normal ml-1">days</span>
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Notifications Sent</p>
                      </div>
                      <p className="text-2xl font-bold">{pushStats?.totalSubscriptions ?? 0}</p>
                    </div>
                  </div>
                </div>

                {/* Security Status */}
                {('banned' in session.user && session.user.banned) && (
                  <>
                    <Separator />
                    <Alert variant="destructive">
                      <ShieldAlert className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Account Restricted</strong>
                        {'banReason' in session.user && session.user.banReason && typeof session.user.banReason === 'string' && (
                          <p className="mt-1">Reason: {session.user.banReason}</p>
                        )}
                        {'banExpires' in session.user && session.user.banExpires && (
                          <p className="mt-1">
                            Expires: {formatDate(new Date(session.user.banExpires as string | number | Date))}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security & Authentication Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Authentication Methods
                </CardTitle>
                <CardDescription>
                  Linked authentication providers and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Authentication */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email & Password</p>
                      <p className="text-sm text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.user.emailVerified ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Not configured</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Key className="h-4 w-4 mr-2" />
                    Enable
                  </Button>
                </div>

                {/* Info Box */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Tip:</strong> Enable two-factor authentication to add an extra layer of security to your account.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

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
                    onClick={() => void handleRevokeAllOtherSessions()}
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
                                      onClick={() => {
                                        toggleSessionToken(sessionItem.id);
                                      }}
                                      className="flex items-center gap-1 text-xs hover:text-foreground"
                                    >
                                      {showSessionTokens[sessionItem.id] ? (
                                        <>
                                          <EyeOff className="h-3 w-3" />
                                          <span className="font-mono">
                                            {sessionItem.token.slice(0, 8)}...
                                            {sessionItem.token.slice(-8)}
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
                                onClick={() => {
                                  openSessionDeleteModal(sessionItem);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {index < sessions.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <PushNotificationSettings key={session.user.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Session Delete Dialog */}
      <Dialog
        open={isSessionDeleteModalOpen}
        onOpenChange={setIsSessionDeleteModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this session? The user will be
              signed out from this device.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              {selectedSession &&
                getSessionDeviceIcon(selectedSession.userAgent)}
              <div>
                <p className="font-medium">
                  {selectedSession &&
                    getUserAgentInfo(selectedSession.userAgent)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedSession &&
                    getLocationInfo(selectedSession.ipAddress)}
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
              onClick={() => {
                setIsSessionDeleteModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRevokeSession()}
            >
              Revoke Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
