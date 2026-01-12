'use client'

import { 
  Building2, 
  Users, 
  Settings, 
  Home, 
  Shield, 
  UserCircle,
  LayoutDashboard,
  ChevronUp,
  LogOut,
  Beaker,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home as HomeRoute } from '@/routes'
import { useSession, signOut } from '@/lib/auth'
import { revalidateAllAction } from '@/components/signout/revalidateAll.action'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@repo/ui/components/shadcn/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/shadcn/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  exact?: boolean
}

const mainNavItems: NavItem[] = [
  { 
    name: 'Overview', 
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  { 
    name: 'Organizations', 
    href: '/dashboard/organizations',
    icon: Building2,
  },
]

const adminNavItems: NavItem[] = [
  { 
    name: 'Users', 
    href: '/dashboard/admin/users',
    icon: Users,
  },
  { 
    name: 'Organizations', 
    href: '/dashboard/admin/organizations',
    icon: Building2,
  },
  { 
    name: 'System', 
    href: '/dashboard/admin/system',
    icon: Settings,
  },
]

const accountNavItems: NavItem[] = [
  { 
    name: 'Profile', 
    href: '/dashboard/profile',
    icon: UserCircle,
  },
]

const devNavItems: NavItem[] = [
  { 
    name: 'Demo', 
    href: '/dashboard/demo',
    icon: Beaker,
  },
]

function getInitials(name: string | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Check if user has admin role
  const isAdmin = session?.user.role === 'admin' || session?.user.role === 'superAdmin'
  const isDev = process.env.NODE_ENV === 'development'

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  const handleSignOut = async () => {
    await signOut()
    void revalidateAllAction()
    // Force redirect to home page after signout
    window.location.href = '/'
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <HomeRoute.Link>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Home className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Dashboard</span>
                  <span className="text-xs text-muted-foreground">Manage your workspace</span>
                </div>
              </HomeRoute.Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.name}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only shown for admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Shield className="size-3 mr-1" />
              Admin Panel
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.name}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.name}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Development Section - Only in dev mode */}
        {isDev && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Beaker className="size-3 mr-1" />
              Development
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {devNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.name}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />

      {/* User Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={session?.user.image ?? undefined} alt={session?.user.name ?? 'User'} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(session?.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user.name ?? 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.user.email ?? ''}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={session?.user.image ?? undefined} alt={session?.user.name ?? 'User'} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(session?.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {session?.user.name ?? 'User'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {session?.user.email ?? ''}
                      </span>
                    </div>
                    {isAdmin && (
                      <Shield className="size-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSignOut()} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
