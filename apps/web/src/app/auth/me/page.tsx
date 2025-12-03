"use client";

import React from "react";
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
} from "lucide-react";
import { authClient, useSession } from "@/lib/auth";
import { Spinner } from "@repo/ui/components/atomics/atoms/Icon";
import { Session } from "better-auth";
import { PushNotificationSettings } from "@/components/push-notifications/PushNotificationSettings";

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
                <p>
                  <strong>Name:</strong> {session.user.name}
                </p>
                <p>
                  <strong>Email:</strong> {session.user.email}
                </p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <strong>Email Verified:</strong>
                  {session.user.emailVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  {session.user.emailVerified ? "Yes" : "No"}
                </p>
                <p>
                  <strong>User ID:</strong> {session.user.id}
                </p>
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
      </div>
      
      <PushNotificationSettings />

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
