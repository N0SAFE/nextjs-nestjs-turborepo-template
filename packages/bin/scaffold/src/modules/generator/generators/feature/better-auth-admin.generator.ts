/**
 * Better Auth Admin Generator
 *
 * Sets up Better Auth Admin plugin for user management and admin dashboard.
 * Provides admin panel components, user management API, and session management.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class BetterAuthAdminGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "better-auth-admin",
    priority: 31, // After better-auth (30)
    version: "1.0.0",
    description: "Better Auth Admin plugin for user management and admin dashboard",
    contributesTo: [
      "apps/api/src/auth/**",
      "apps/web/src/app/(admin)/**",
      "apps/web/src/components/admin/**",
    ],
    dependsOn: ["better-auth"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // API: Admin auth configuration extension
    files.push(
      this.file(
        "apps/api/src/auth/admin.ts",
        this.getApiAdminConfig(),
        { mergeStrategy: "replace", priority: 31 },
      ),
    );

    // API: Admin controller for user management
    files.push(
      this.file(
        "apps/api/src/auth/admin.controller.ts",
        this.getAdminController(),
        { mergeStrategy: "replace", priority: 31 },
      ),
    );

    // API: Admin service for user operations
    files.push(
      this.file(
        "apps/api/src/auth/admin.service.ts",
        this.getAdminService(),
        { mergeStrategy: "replace", priority: 31 },
      ),
    );

    // API: Admin guard
    files.push(
      this.file(
        "apps/api/src/auth/guards/admin.guard.ts",
        this.getAdminGuard(),
        { mergeStrategy: "replace", priority: 31 },
      ),
    );

    // Web: Admin components if Next.js is enabled
    if (this.hasPlugin(context, "nextjs")) {
      // Admin layout
      files.push(
        this.file(
          "apps/web/src/app/(admin)/layout.tsx",
          this.getAdminLayout(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );

      // Admin dashboard page
      files.push(
        this.file(
          "apps/web/src/app/(admin)/admin/page.tsx",
          this.getAdminDashboardPage(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );

      // Users management page
      files.push(
        this.file(
          "apps/web/src/app/(admin)/admin/users/page.tsx",
          this.getAdminUsersPage(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );

      // Sessions management page
      files.push(
        this.file(
          "apps/web/src/app/(admin)/admin/sessions/page.tsx",
          this.getAdminSessionsPage(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );

      // Admin sidebar component
      files.push(
        this.file(
          "apps/web/src/components/admin/admin-sidebar.tsx",
          this.getAdminSidebar(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );

      // User table component
      files.push(
        this.file(
          "apps/web/src/components/admin/user-table.tsx",
          this.getUserTableComponent(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );

      // Session table component
      files.push(
        this.file(
          "apps/web/src/components/admin/session-table.tsx",
          this.getSessionTableComponent(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );

      // Admin hooks
      files.push(
        this.file(
          "apps/web/src/hooks/use-admin.ts",
          this.getAdminHooks(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );

      // Admin types
      files.push(
        this.file(
          "apps/web/src/types/admin.ts",
          this.getAdminTypes(),
          { mergeStrategy: "replace", priority: 31 },
        ),
      );
    }

    return files;
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [];

    // Admin plugin is part of better-auth, no additional deps needed for core
    // Add UI dependencies for admin panel if Next.js is enabled
    if (this.hasPlugin(context, "nextjs")) {
      deps.push(
        {
          name: "@tanstack/react-table",
          version: "^8.20.0",
          type: "prod",
          target: "apps/web",
          pluginId: "better-auth-admin",
        },
        {
          name: "date-fns",
          version: "^3.6.0",
          type: "prod",
          target: "apps/web",
          pluginId: "better-auth-admin",
        },
      );
    }

    return deps;
  }

  private getApiAdminConfig(): string {
    return `/**
 * Better Auth Admin Configuration
 *
 * Extends the base auth configuration with admin capabilities.
 */
import { admin } from "better-auth/plugins";
import { auth } from "./auth";

/**
 * Admin plugin configuration
 * Provides user management, session management, and ban capabilities
 */
export const adminPlugin = admin({
  // Default role for new users
  defaultRole: "user",
  // Admin role that has access to admin features
  adminRole: "admin",
});

/**
 * Check if a user has admin privileges
 */
export function isAdmin(user: { role?: string } | null): boolean {
  return user?.role === "admin";
}

/**
 * Admin user type
 */
export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
};

/**
 * Admin session type
 */
export type AdminSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export { auth };
`;
  }

  private getAdminController(): string {
    return `import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "./guards/admin.guard";
import { AdminService } from "./admin.service";

@Controller("api/admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * List all users with pagination
   */
  @Get("users")
  async listUsers(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("search") search?: string,
  ) {
    return this.adminService.listUsers({ page, limit, search });
  }

  /**
   * Get a specific user by ID
   */
  @Get("users/:id")
  async getUser(@Param("id") id: string) {
    return this.adminService.getUser(id);
  }

  /**
   * Update a user's details
   */
  @Patch("users/:id")
  async updateUser(
    @Param("id") id: string,
    @Body() data: { name?: string; role?: string },
  ) {
    return this.adminService.updateUser(id, data);
  }

  /**
   * Delete a user
   */
  @Delete("users/:id")
  async deleteUser(@Param("id") id: string) {
    return this.adminService.deleteUser(id);
  }

  /**
   * Ban a user
   */
  @Post("users/:id/ban")
  async banUser(
    @Param("id") id: string,
    @Body() data: { reason?: string; expiresAt?: string },
  ) {
    return this.adminService.banUser(id, data);
  }

  /**
   * Unban a user
   */
  @Post("users/:id/unban")
  async unbanUser(@Param("id") id: string) {
    return this.adminService.unbanUser(id);
  }

  /**
   * List all sessions
   */
  @Get("sessions")
  async listSessions(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("userId") userId?: string,
  ) {
    return this.adminService.listSessions({ page, limit, userId });
  }

  /**
   * Revoke a session
   */
  @Delete("sessions/:id")
  async revokeSession(@Param("id") id: string) {
    return this.adminService.revokeSession(id);
  }

  /**
   * Revoke all sessions for a user
   */
  @Delete("users/:id/sessions")
  async revokeUserSessions(@Param("id") userId: string) {
    return this.adminService.revokeUserSessions(userId);
  }

  /**
   * Get admin dashboard stats
   */
  @Get("stats")
  async getStats() {
    return this.adminService.getStats();
  }
}
`;
  }

  private getAdminService(): string {
    return `import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { auth } from "./admin";

@Injectable()
export class AdminService {
  /**
   * List users with pagination
   */
  async listUsers(options: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = options;
    const offset = (page - 1) * limit;

    // Using Better Auth's admin API to list users
    const result = await auth.api.listUsers({
      query: {
        limit,
        offset,
        search,
      },
    });

    return {
      users: result.users,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  /**
   * Get a single user
   */
  async getUser(id: string) {
    const user = await auth.api.getUser({ query: { id } });
    if (!user) {
      throw new NotFoundException(\`User \${id} not found\`);
    }
    return user;
  }

  /**
   * Update user details
   */
  async updateUser(id: string, data: { name?: string; role?: string }) {
    const user = await this.getUser(id);
    
    const result = await auth.api.updateUser({
      body: {
        userId: id,
        ...data,
      },
    });

    return result;
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string) {
    await this.getUser(id); // Verify user exists
    
    await auth.api.deleteUser({
      body: { userId: id },
    });

    return { success: true };
  }

  /**
   * Ban a user
   */
  async banUser(id: string, data: { reason?: string; expiresAt?: string }) {
    await this.getUser(id); // Verify user exists

    const result = await auth.api.banUser({
      body: {
        userId: id,
        banReason: data.reason,
        banExpiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    return result;
  }

  /**
   * Unban a user
   */
  async unbanUser(id: string) {
    await this.getUser(id); // Verify user exists

    const result = await auth.api.unbanUser({
      body: { userId: id },
    });

    return result;
  }

  /**
   * List sessions with pagination
   */
  async listSessions(options: { page: number; limit: number; userId?: string }) {
    const { page, limit, userId } = options;
    const offset = (page - 1) * limit;

    const result = await auth.api.listSessions({
      query: {
        limit,
        offset,
        userId,
      },
    });

    return {
      sessions: result.sessions,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  /**
   * Revoke a single session
   */
  async revokeSession(id: string) {
    await auth.api.revokeSession({
      body: { sessionId: id },
    });

    return { success: true };
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeUserSessions(userId: string) {
    await this.getUser(userId); // Verify user exists

    await auth.api.revokeUserSessions({
      body: { userId },
    });

    return { success: true };
  }

  /**
   * Get admin dashboard statistics
   */
  async getStats() {
    const [usersResult, sessionsResult] = await Promise.all([
      auth.api.listUsers({ query: { limit: 1 } }),
      auth.api.listSessions({ query: { limit: 1 } }),
    ]);

    return {
      totalUsers: usersResult.total,
      totalSessions: sessionsResult.total,
      // Add more stats as needed
    };
  }
}
`;
  }

  private getAdminGuard(): string {
    return `import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { auth, isAdmin } from "../admin";

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new UnauthorizedException("Not authenticated");
    }

    if (!isAdmin(session.user)) {
      throw new ForbiddenException("Admin access required");
    }

    // Attach user to request for later use
    request.user = session.user;
    request.session = session.session;

    return true;
  }
}
`;
  }

  private getAdminLayout(): string {
    return `import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Redirect if not authenticated or not admin
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
`;
  }

  private getAdminDashboardPage(): string {
    return `"use client";

import { useAdminStats } from "@/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Key, Activity } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, sessions, and system settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;
  }

  private getAdminUsersPage(): string {
    return `"use client";

import { useState } from "react";
import { useAdminUsers, useBanUser, useUnbanUser, useDeleteUser } from "@/hooks/use-admin";
import { UserTable } from "@/components/admin/user-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const { data, isLoading, refetch } = useAdminUsers({ page, limit: 20, search });
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const deleteUser = useDeleteUser();

  const handleBan = async (userId: string, reason?: string) => {
    await banUser.mutateAsync({ userId, reason });
    refetch();
  };

  const handleUnban = async (userId: string) => {
    await unbanUser.mutateAsync({ userId });
    refetch();
  };

  const handleDelete = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteUser.mutateAsync({ userId });
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <UserTable
        users={data?.users ?? []}
        isLoading={isLoading}
        onBan={handleBan}
        onUnban={handleUnban}
        onDelete={handleDelete}
      />

      {data && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {data.users.length} of {data.total} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
`;
  }

  private getAdminSessionsPage(): string {
    return `"use client";

import { useState } from "react";
import { useAdminSessions, useRevokeSession } from "@/hooks/use-admin";
import { SessionTable } from "@/components/admin/session-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function AdminSessionsPage() {
  const [page, setPage] = useState(1);
  
  const { data, isLoading, refetch } = useAdminSessions({ page, limit: 20 });
  const revokeSession = useRevokeSession();

  const handleRevoke = async (sessionId: string) => {
    if (confirm("Are you sure you want to revoke this session?")) {
      await revokeSession.mutateAsync({ sessionId });
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">
            View and manage active user sessions.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <SessionTable
        sessions={data?.sessions ?? []}
        isLoading={isLoading}
        onRevoke={handleRevoke}
      />

      {data && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {data.sessions.length} of {data.total} sessions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
`;
  }

  private getAdminSidebar(): string {
    return `"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Key,
  Settings,
  ChevronLeft,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Sessions", href: "/admin/sessions", icon: Key },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Back to App
        </Link>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
`;
  }

  private getUserTableComponent(): string {
    return `"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Ban, UserX, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { AdminUser } from "@/types/admin";

interface UserTableProps {
  users: AdminUser[];
  isLoading: boolean;
  onBan: (userId: string, reason?: string) => void;
  onUnban: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export function UserTable({
  users,
  isLoading,
  onBan,
  onUnban,
  onDelete,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{user.name || "—"}</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              {user.banned ? (
                <Badge variant="destructive">Banned</Badge>
              ) : user.emailVerified ? (
                <Badge variant="outline" className="text-green-500 border-green-500">
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline">Unverified</Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user.banned ? (
                    <DropdownMenuItem onClick={() => onUnban(user.id)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Unban User
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onBan(user.id)}>
                      <Ban className="h-4 w-4 mr-2" />
                      Ban User
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(user.id)}
                    className="text-destructive"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
`;
  }

  private getSessionTableComponent(): string {
    return `"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { AdminSession } from "@/types/admin";

interface SessionTableProps {
  sessions: AdminSession[];
  isLoading: boolean;
  onRevoke: (sessionId: string) => void;
}

export function SessionTable({
  sessions,
  isLoading,
  onRevoke,
}: SessionTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No sessions found
      </div>
    );
  }

  const isExpired = (expiresAt: Date) => new Date(expiresAt) < new Date();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session ID</TableHead>
          <TableHead>User ID</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="font-mono text-sm">
              {session.id.slice(0, 8)}...
            </TableCell>
            <TableCell className="font-mono text-sm">
              {session.userId.slice(0, 8)}...
            </TableCell>
            <TableCell className="text-muted-foreground">
              {session.ipAddress || "Unknown"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(new Date(session.expiresAt), { addSuffix: true })}
            </TableCell>
            <TableCell>
              {isExpired(session.expiresAt) ? (
                <Badge variant="secondary">Expired</Badge>
              ) : (
                <Badge variant="outline" className="text-green-500 border-green-500">
                  Active
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRevoke(session.id)}
                disabled={isExpired(session.expiresAt)}
              >
                <X className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
`;
  }

  private getAdminHooks(): string {
    return `"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(\`\${API_BASE}\${url}\`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

// Queries

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchJson<{ totalUsers: number; totalSessions: number }>("/api/admin/stats"),
  });
}

export function useAdminUsers(options: { page: number; limit: number; search?: string }) {
  return useQuery({
    queryKey: ["admin", "users", options],
    queryFn: () =>
      fetchJson<{
        users: Array<{
          id: string;
          email: string;
          name: string | null;
          role: string;
          emailVerified: boolean;
          banned: boolean;
          createdAt: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(\`/api/admin/users?page=\${options.page}&limit=\${options.limit}\${options.search ? \`&search=\${options.search}\` : ""}\`),
  });
}

export function useAdminSessions(options: { page: number; limit: number; userId?: string }) {
  return useQuery({
    queryKey: ["admin", "sessions", options],
    queryFn: () =>
      fetchJson<{
        sessions: Array<{
          id: string;
          userId: string;
          expiresAt: string;
          ipAddress: string | null;
          userAgent: string | null;
          createdAt: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(\`/api/admin/sessions?page=\${options.page}&limit=\${options.limit}\${options.userId ? \`&userId=\${options.userId}\` : ""}\`),
  });
}

// Mutations

export function useBanUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) =>
      fetchJson(\`/api/admin/users/\${userId}/ban\`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) =>
      fetchJson(\`/api/admin/users/\${userId}/unban\`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) =>
      fetchJson(\`/api/admin/users/\${userId}\`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) =>
      fetchJson(\`/api/admin/sessions/\${sessionId}\`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
`;
  }

  private getAdminTypes(): string {
    return `/**
 * Admin Types
 *
 * Type definitions for admin functionality.
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | string | null;
}

export interface AdminSession {
  id: string;
  userId: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  activeUsersToday?: number;
  newUsersThisWeek?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
`;
  }
}
