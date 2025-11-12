/**
 * Access Control Utilities - Usage Examples
 * 
 * This file demonstrates various ways to use the access control utilities
 * in your NestJS controllers and services.
 */

import { Controller, Get, Post, Put, Delete, UseGuards, Param, Body, Req } from '@nestjs/common';
import { type ExecutionContext } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import type { Auth } from '@/auth';
import {
  allowRoles,
  allowAllRoles,
  denyRoles,
  allowPermissions,
  allowAnyPermissions,
  allowRolesAndPermissions,
  allowRolesOrPermissions,
  allowOwnerOrAdmin,
  customAccess,
  AccessControlUtils,
} from './access-control.utils';

/**
 * Example 1: Basic Role Check
 * Check if user has any of the specified roles
 */
@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  @Get('dashboard')
  @ApiOkResponse({ description: 'Admin dashboard data' })
  getDashboard(@Req() context: ExecutionContext) {
    // Throws error if user is not admin or super_admin
    allowRoles(context, ['admin', 'super_admin']);
    
    return { message: 'Welcome to admin dashboard' };
  }

  @Get('stats')
  @ApiOkResponse({ description: 'Admin statistics' })
  getStats(@Req() context: ExecutionContext) {
    // Non-throwing version - returns result object
    const result = allowRoles(context, ['admin', 'super_admin'], {
      throwOnFail: false,
    });
    
    if (!result.allowed) {
      return { error: result.reason };
    }
    
    return { stats: 'Admin statistics' };
  }
}

/**
 * Example 2: Multiple Role Requirements
 * Check if user has ALL specified roles
 */
@Controller('super-admin')
@UseGuards(AuthGuard)
export class SuperAdminController {
  @Delete('users/:id')
  @ApiOkResponse({ description: 'User deleted successfully' })
  deleteUser(
    @Req() context: ExecutionContext,
    @Param('id') userId: string,
  ) {
    // User must have both admin AND super_admin roles
    allowAllRoles(context, ['admin', 'super_admin']);
    
    return { message: `User ${userId} deleted` };
  }
}

/**
 * Example 3: Role Denial
 * Ensure user does NOT have certain roles
 */
@Controller('public')
export class PublicController {
  @Get('content')
  @ApiOkResponse({ description: 'Public content' })
  getPublicContent(@Req() context: ExecutionContext) {
    // Ensure user is not banned
    denyRoles(context, ['banned', 'suspended']);
    
    return { content: 'Public content accessible to non-banned users' };
  }
}

/**
 * Example 4: Permission-Based Access
 * Check specific permissions
 */
@Controller('posts')
@UseGuards(AuthGuard)
export class PostsController {
  constructor(private readonly auth: Auth) {}

  @Post()
  @ApiOkResponse({ description: 'Post created successfully' })
  async createPost(
    @Req() context: ExecutionContext,
     
    @Body() _postData: unknown,
  ) {
    // Check if user has permission to create posts
    await allowPermissions(context, this.auth, {
      posts: ['create'],
    });
    
    return { message: 'Post created' };
  }

  @Put(':id')
  @ApiOkResponse({ description: 'Post updated successfully' })
  async updatePost(
    @Req() context: ExecutionContext,
    @Param('id') postId: string,
     
    @Body() _postData: unknown,
  ) {
    // Check if user has permission to update posts
    await allowPermissions(context, this.auth, {
      posts: ['update'],
    });
    
    return { message: `Post ${postId} updated` };
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Post deleted successfully' })
  async deletePost(
    @Req() context: ExecutionContext,
    @Param('id') postId: string,
  ) {
    // Check if user has ANY of these permission sets
    await allowAnyPermissions(context, this.auth, [
      { posts: ['delete'] },
      { posts: ['*'] }, // Admin with all post permissions
    ]);
    
    return { message: `Post ${postId} deleted` };
  }
}

/**
 * Example 5: Combined Role and Permission Checks
 */
@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly auth: Auth) {}

  @Get('financial')
  @ApiOkResponse({ description: 'Financial reports data' })
  async getFinancialReports(@Req() context: ExecutionContext) {
    // User must be admin OR manager AND have read permission
    await allowRolesAndPermissions(
      context,
      this.auth,
      ['admin', 'manager'],
      { reports: ['read'] },
    );
    
    return { reports: 'Financial data' };
  }

  @Get('analytics')
  @ApiOkResponse({ description: 'Analytics data' })
  async getAnalytics(@Req() context: ExecutionContext) {
    // User must be admin OR have analytics permission
    await allowRolesOrPermissions(
      context,
      this.auth,
      ['admin', 'super_admin'],
      { analytics: ['read'] },
    );
    
    return { analytics: 'Analytics data' };
  }
}

/**
 * Example 6: Owner or Admin Pattern
 * Common pattern where resource owners or admins can access
 */
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  @Get(':id/profile')
  @ApiOkResponse({ description: 'User profile data' })
  getUserProfile(
    @Req() context: ExecutionContext,
    @Param('id') userId: string,
  ) {
    // User can view their own profile or admin can view anyone's
    allowOwnerOrAdmin(context, userId, ['admin', 'super_admin']);
    
    return { profile: 'User profile data' };
  }

  @Put(':id/settings')
  @ApiOkResponse({ description: 'Settings updated successfully' })
  updateSettings(
    @Req() context: ExecutionContext,
    @Param('id') userId: string,
     
    @Body() _settings: unknown,
  ) {
    // Custom error message for owner check
    allowOwnerOrAdmin(context, userId, ['admin'], {
      errorMessage: 'You can only update your own settings',
    });
    
    return { message: 'Settings updated' };
  }
}

/**
 * Example 7: Custom Access Logic
 * Use custom predicates for complex access rules
 */
@Controller('premium')
@UseGuards(AuthGuard)
export class PremiumController {
  @Get('content')
  @ApiOkResponse({ description: 'Premium content' })
  getPremiumContent(@Req() context: ExecutionContext) {
    // Custom logic: user must be verified and have premium status
    customAccess(context, (user) => {
      // Type assertion for custom user properties not in the base User type
      return user.emailVerified && (user as { isPremium?: boolean }).isPremium === true;
    }, {
      errorMessage: 'Premium verified account required',
    });
    
    return { content: 'Premium content' };
  }

  @Get('beta-features')
  @ApiOkResponse({ description: 'Beta features data' })
  getBetaFeatures(@Req() context: ExecutionContext) {
    // Complex custom logic
    customAccess(context, (user) => {
      const isEarlyAdopter = user.createdAt < new Date('2024-01-01');
      // Type assertion for custom user properties not in the base User type
      const userWithReputation = user as { reputation?: number };
      const hasGoodReputation = userWithReputation.reputation !== undefined && userWithReputation.reputation > 100;
      return isEarlyAdopter && hasGoodReputation;
    });
    
    return { features: 'Beta features' };
  }
}

/**
 * Example 8: Service-Level Access Control
 * Use utilities in services for business logic
 */
export class UserService {
  constructor(private readonly auth: Auth) {}

  promoteToAdmin(context: ExecutionContext, targetUserId: string) {
    // Only super admins can promote users to admin
    allowRoles(context, ['super_admin'], {
      errorMessage: 'Only super administrators can promote users',
    });
    
    // Business logic here
    return { message: `User ${targetUserId} promoted to admin` };
  }

  deleteUserAccount(context: ExecutionContext, targetUserId: string) {
    // User can delete their own account OR admin can delete
    const result = allowOwnerOrAdmin(
      context,
      targetUserId,
      ['admin', 'super_admin'],
      { throwOnFail: false },
    );
    
    if (!result.allowed) {
      // Log unauthorized attempt
      console.warn(`Unauthorized account deletion attempt: ${result.reason ?? 'unknown'}`);
      throw new Error('Unauthorized');
    }
    
    // Proceed with deletion
    return { message: 'Account deleted' };
  }
}

/**
 * Example 9: Middleware-Style Access Control
 * Use utilities directly in request handlers
 */
export class ProjectMiddleware {
  constructor(private readonly auth: Auth) {}

  async validateProjectAccess(context: ExecutionContext, projectId: string) {
    const user = AccessControlUtils.getUserFromContext(context);
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Check if user owns the project or is admin
    const isOwner = await this.checkProjectOwnership(user.id, projectId);
    
    if (!isOwner) {
      // If not owner, must be admin with project permissions
      await allowRolesAndPermissions(
        context,
        this.auth,
        ['admin', 'super_admin'],
        { projects: ['read', 'update'] },
      );
    }
    
    return true;
  }

  checkProjectOwnership(_userId: string, _projectId: string): Promise<boolean> {
    // Your database logic here
    return Promise.resolve(false);
  }
}

/**
 * Example 10: Combining Multiple Checks
 * Complex access scenarios
 */
@Controller('sensitive')
@UseGuards(AuthGuard)
export class SensitiveDataController {
  constructor(private readonly auth: Auth) {}

  @Get('financial-records')
  @ApiOkResponse({ description: 'Sensitive financial records' })
  async getFinancialRecords(@Req() context: ExecutionContext) {
    // Step 1: Must be authenticated
    AccessControlUtils.requireAuth(context);
    
    // Step 2: Must not be banned
    denyRoles(context, ['banned', 'suspended']);
    
    // Step 3: Must be admin OR have explicit permission
    const roleCheck = allowRoles(context, ['admin', 'super_admin'], {
      throwOnFail: false,
    });
    
    if (!roleCheck.allowed) {
      // Not admin, check permissions
      await allowPermissions(context, this.auth, {
        financial: ['read'],
      });
    }
    
    return { records: 'Sensitive financial data' };
  }
}

/**
 * Example 11: Using AccessControlUtils Helper Methods
 */
@Controller('profile')
export class ProfileController {
  @Get('me')
  @ApiOkResponse({ description: 'Current user information' })
  getCurrentUser(@Req() context: ExecutionContext) {
    // Get user from context
    const user = AccessControlUtils.getUserFromContext(context);
    
    if (!user) {
      return { error: 'Not authenticated' };
    }
    
    return {
      id: user.id,
      email: user.email,
      role: AccessControlUtils.getUserRoleFromContext(context),
      roles: AccessControlUtils.getUserRolesFromContext(context),
    };
  }

  @Get('check-auth')
  @ApiOkResponse({ description: 'Authentication status' })
  checkAuth(@Req() context: ExecutionContext) {
    // Check if user is authenticated (returns boolean)
    const isAuth = AccessControlUtils.isAuthenticated(context);
    
    return { authenticated: isAuth };
  }
}

/**
 * Best Practices:
 * 
 * 1. Use throwOnFail=true (default) for API endpoints to automatically return errors
 * 2. Use throwOnFail=false when you need custom error handling or logging
 * 3. Combine role and permission checks for fine-grained access control
 * 4. Use customAccess for complex business logic that doesn't fit standard patterns
 * 5. Use allowOwnerOrAdmin for resources that have ownership
 * 6. Always validate authentication before checking roles/permissions
 * 7. Provide custom error messages for better UX
 * 8. Consider caching permission checks for performance in high-traffic endpoints
 */
