# Use Cases and Examples

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > Use Cases

## Overview

This document provides real-world use cases and examples of using the Stratum Builder to create various types of projects. Each use case includes the complete workflow from initialization to deployment.

## Use Case 1: Simple SaaS Application

### Scenario
Create a basic SaaS application with authentication, database, and API.

### Requirements
- Next.js frontend
- NestJS backend
- User authentication
- PostgreSQL database
- Type-safe API

### Implementation

```bash
# Initialize project
stratum init my-saas --template minimal

# Interactive prompts
? Project name: my-saas
? Description: Simple SaaS application
? Package manager: bun

# Select features
✓ Base Template (required)
✓ TypeScript (required)
✓ Turborepo (required)
✓ ORPC (Type-safe API)
✓ Better Auth (Authentication)
✓ Database (PostgreSQL + Drizzle)
✓ Shadcn UI (UI Components)
✓ Docker (Containerization)

# Installation process
🚀 Creating your Stratum project...
✓ Project created successfully!

# Start development
cd my-saas
bun run dev
```

### Project Structure

```
my-saas/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── auth/          # Better Auth setup
│   │       ├── user/          # User module
│   │       └── main.ts
│   └── web/
│       └── src/
│           ├── app/           # Next.js App Router
│           ├── components/    # UI components
│           └── lib/           # ORPC client
├── packages/
│   ├── api-contracts/         # ORPC contracts
│   ├── ui/                    # Shared components
│   └── types/                 # Shared types
├── .stratum.json              # Project config
└── docker-compose.yml         # Docker setup
```

### Features Included
- ✅ User registration and login
- ✅ Session management
- ✅ Protected routes
- ✅ Type-safe API calls
- ✅ Database migrations
- ✅ Docker development environment

---

## Use Case 2: API-Only Backend

### Scenario
Create a standalone API service without frontend.

### Requirements
- NestJS backend only
- RESTful API with ORPC
- Authentication
- Job queue for background tasks
- Redis caching

### Implementation

```bash
stratum init api-service --template api-only

# Select features
✓ Base Template
✓ TypeScript
✓ ORPC
✓ Better Auth
✓ Database
✓ Redis
✓ Job Queue (Bull)
✓ Event System
✓ Docker
✓ Monitoring
```

### Configuration

```json
// .stratum.json
{
  "project": {
    "name": "api-service",
    "type": "api-only"
  },
  "plugins": {
    "orpc": {
      "config": {
        "enableOpenAPI": true,
        "enableValidation": true
      }
    },
    "job-queue": {
      "config": {
        "queues": ["email", "reports", "notifications"],
        "concurrency": 10
      }
    }
  }
}
```

### Usage Example

```typescript
// apps/api/src/reports/reports.controller.ts
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsQueue: ReportsQueue
  ) {}
  
  @ORPCRoute()
  async generate(@Body() data: GenerateReportDto) {
    // Queue report generation
    const job = await this.reportsQueue.add('generate', {
      userId: data.userId,
      type: data.type,
      dateRange: data.dateRange
    });
    
    return {
      jobId: job.id,
      status: 'queued'
    };
  }
  
  @ORPCRoute()
  async getStatus(@Param('jobId') jobId: string) {
    const job = await this.reportsQueue.getJob(jobId);
    return {
      status: await job.getState(),
      progress: job.progress()
    };
  }
}
```

---

## Use Case 3: Full-Featured SaaS Platform

### Scenario
Create a production-ready SaaS platform with all features.

### Requirements
- Complete authentication system
- File uploads
- Email notifications
- Payment integration (Stripe)
- Analytics
- SEO optimization
- CI/CD pipeline
- Monitoring and logging

### Implementation

```bash
stratum init saas-platform --template full

# All features
✓ All Core Features
✓ ORPC
✓ Better Auth (with MFA)
✓ Database
✓ Redis
✓ Job Queue
✓ Event System
✓ File Upload (S3)
✓ Email Service
✓ Webhooks
✓ Search (PostgreSQL FTS)
✓ i18n
✓ Shadcn UI
✓ Theme System
✓ Stripe Integration
✓ Analytics
✓ SEO
✓ Docker
✓ CI/CD
✓ Monitoring (Sentry)
✓ Testing
```

### Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer                  │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼───┐
│  Web   │      │  API   │
│  App   │      │ Server │
└───┬────┘      └────┬───┘
    │                │
    └────────┬───────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼────┐
│ Postgres│      │  Redis  │
│Database │      │  Cache  │
└─────────┘      └─────────┘
```

### Configuration

```json
{
  "plugins": {
    "better-auth": {
      "config": {
        "providers": ["credentials", "google", "github"],
        "enableMFA": true,
        "mfaMethods": ["totp", "email"]
      }
    },
    "file-upload": {
      "config": {
        "storage": "s3",
        "bucket": "my-saas-uploads",
        "maxSize": 52428800,
        "allowedTypes": ["image/*", "application/pdf"]
      }
    },
    "stripe": {
      "config": {
        "plans": [
          {
            "id": "basic",
            "price": 9.99,
            "interval": "month"
          },
          {
            "id": "pro",
            "price": 29.99,
            "interval": "month"
          }
        ]
      }
    }
  }
}
```

---

## Use Case 4: Microservices Architecture

### Scenario
Create multiple independent services in a monorepo.

### Requirements
- User service
- Payment service
- Notification service
- Shared packages
- Event-driven communication

### Implementation

```bash
stratum init microservices --template monorepo

# Create services
stratum add service user-service
stratum add service payment-service
stratum add service notification-service

# Add shared features
stratum add event-system
stratum add redis
stratum add docker
```

### Structure

```
microservices/
├── apps/
│   ├── user-service/
│   │   └── src/
│   │       ├── user/
│   │       └── main.ts
│   ├── payment-service/
│   │   └── src/
│   │       ├── payments/
│   │       └── main.ts
│   └── notification-service/
│       └── src/
│           ├── notifications/
│           └── main.ts
├── packages/
│   ├── events/            # Shared events
│   ├── types/             # Shared types
│   └── config/            # Shared config
└── docker-compose.yml
```

### Event Communication

```typescript
// packages/events/src/user-events.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {}
}

// apps/user-service/src/user/user.service.ts
async create(data: CreateUserDto) {
  const user = await this.db.insert(users).values(data);
  
  // Emit event
  await this.eventBus.emit(
    new UserCreatedEvent(user.id, user.email)
  );
  
  return user;
}

// apps/notification-service/src/handlers/user-created.handler.ts
@EventHandler(UserCreatedEvent)
export class UserCreatedHandler {
  async handle(event: UserCreatedEvent) {
    await this.emailService.sendWelcome(event.email);
  }
}
```

---

## Use Case 5: Mobile Backend (BFF Pattern)

### Scenario
Create a Backend-for-Frontend (BFF) for mobile app.

### Requirements
- GraphQL or ORPC API
- Push notifications
- Image processing
- File downloads
- Offline sync support

### Implementation

```bash
stratum init mobile-backend --template bff

# Select features
✓ ORPC
✓ Better Auth (JWT + Refresh Tokens)
✓ Database
✓ Redis (for offline sync)
✓ File Upload (image processing)
✓ Push Notifications
✓ Job Queue
✓ Docker
```

### API Design

```typescript
// apps/api/src/posts/posts.contract.ts
export const postsRouter = orpc.router({
  // List posts with pagination
  list: orpc
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().default(20)
    }))
    .output(z.object({
      items: z.array(PostSchema),
      nextCursor: z.string().optional()
    }))
    .handler(async ({ input }) => {
      // Implementation
    }),
  
  // Create post with image
  create: orpc
    .input(z.object({
      content: z.string(),
      image: z.instanceof(File).optional()
    }))
    .output(PostSchema)
    .handler(async ({ input, context }) => {
      // Process image if provided
      if (input.image) {
        input.imageUrl = await processAndUpload(input.image);
      }
      
      // Create post
      return await createPost(input, context.user.id);
    }),
  
  // Sync posts (for offline support)
  sync: orpc
    .input(z.object({
      lastSyncAt: z.date(),
      localChanges: z.array(PostChangeSchema)
    }))
    .output(z.object({
      serverChanges: z.array(PostChangeSchema),
      conflicts: z.array(ConflictSchema)
    }))
    .handler(async ({ input }) => {
      // Sync logic
    })
});
```

---

## Use Case 6: E-commerce Platform

### Scenario
Create an e-commerce platform with product catalog, cart, and checkout.

### Requirements
- Product management
- Shopping cart
- Payment processing (Stripe)
- Order management
- Email notifications
- Inventory tracking

### Implementation

```bash
stratum init ecommerce --template ecommerce

✓ ORPC
✓ Better Auth
✓ Database
✓ Redis (cart storage)
✓ Stripe
✓ Email
✓ Job Queue
✓ File Upload (product images)
✓ Search (product search)
✓ Webhooks (order status)
✓ Shadcn UI
✓ Docker
```

### Database Schema

```typescript
// apps/api/src/db/schema/products.ts
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // in cents
  inventory: integer('inventory').notNull(),
  images: jsonb('images').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow()
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  status: text('status').notNull(), // pending, paid, shipped, delivered
  total: integer('total').notNull(),
  items: jsonb('items').$type<OrderItem[]>(),
  stripePaymentId: text('stripe_payment_id'),
  createdAt: timestamp('created_at').defaultNow()
});
```

### Cart Management

```typescript
// apps/api/src/cart/cart.service.ts
@Injectable()
export class CartService {
  constructor(
    private readonly redis: Redis,
    private readonly db: Database
  ) {}
  
  async addItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getCart(userId);
    
    // Validate product exists and has inventory
    const product = await this.db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    
    if (!product || product.inventory < quantity) {
      throw new Error('Product not available');
    }
    
    // Update cart in Redis
    cart.items.push({
      productId,
      quantity,
      price: product.price
    });
    
    await this.redis.set(
      `cart:${userId}`,
      JSON.stringify(cart),
      'EX',
      86400 // 24 hours
    );
    
    return cart;
  }
}
```

---

## Use Case 7: Content Management System

### Scenario
Create a headless CMS with content modeling and API.

### Requirements
- Content types
- Rich text editor
- Media library
- Version control
- Publishing workflow
- Webhooks

### Implementation

```bash
stratum init cms --template cms

✓ ORPC
✓ Better Auth (role-based access)
✓ Database
✓ File Upload (media library)
✓ Search (content search)
✓ Webhooks (publish notifications)
✓ i18n (multi-language content)
✓ Shadcn UI (admin interface)
```

### Content Types

```typescript
// apps/api/src/content/content.schema.ts
export const contentTypes = pgTable('content_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  fields: jsonb('fields').$type<Field[]>(),
  createdAt: timestamp('created_at').defaultNow()
});

export const contents = pgTable('contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  typeId: uuid('type_id').references(() => contentTypes.id),
  data: jsonb('data'),
  status: text('status'), // draft, published, archived
  version: integer('version').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow()
});
```

---

## Use Case 8: Multi-Tenant SaaS

### Scenario
Create a multi-tenant application where each customer has isolated data.

### Requirements
- Tenant isolation
- Subdomain routing
- Per-tenant customization
- Usage tracking
- Billing per tenant

### Implementation

```bash
stratum init multi-tenant --template saas

✓ All base features
✓ Multi-tenancy plugin
✓ Custom domains
✓ Usage tracking
✓ Stripe (per-tenant billing)
```

### Tenant Isolation

```typescript
// apps/api/src/tenants/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from subdomain
    const host = req.headers.host;
    const subdomain = host.split('.')[0];
    
    // Attach tenant to request
    req.tenant = await this.tenantsService.findBySubdomain(subdomain);
    
    if (!req.tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    next();
  }
}

// Database queries with tenant isolation
async findAll(@Request() req) {
  return this.db
    .select()
    .from(posts)
    .where(eq(posts.tenantId, req.tenant.id));
}
```

---

## Common Patterns

### Pattern 1: Adding Features to Existing Project

```bash
# Add new feature
cd existing-project
stratum add redis job-queue

# Builder analyzes project
🔍 Analyzing existing project...
Current features: base, typescript, orpc, database

# Install new features
✓ Installing Redis
✓ Installing Job Queue
✓ Updating configuration
✓ Running migrations
```

### Pattern 2: Upgrading Project

```bash
# Check for updates
stratum update --dry-run

# Update all features
stratum update

# Update specific features
stratum update orpc better-auth
```

### Pattern 3: Customizing After Generation

```bash
# Generate base project
stratum init my-app

# Customize templates
# Edit files in my-app/

# Add custom plugin
stratum add ./custom-plugins/my-plugin
```

## Next Steps

- Review [Migration Guide](./13-MIGRATION-GUIDE.md) for existing projects
- Study [Troubleshooting](./14-TROUBLESHOOTING.md) for common issues
- Read [Extension Guide](./11-EXTENSION-GUIDE.md) for custom plugins

---

*These use cases demonstrate the flexibility and power of the Stratum Builder.*
