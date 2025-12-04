# Feature Catalog

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > Feature Catalog

## Overview

This document provides a comprehensive catalog of all available plugins in the Stratum Builder ecosystem. Each plugin is documented with its purpose, dependencies, configuration options, and usage examples.

## Plugin Categories

- **Core**: Essential plugins required for every project
- **Feature**: Optional features that add specific capabilities
- **Infrastructure**: Deployment, CI/CD, and DevOps tools
- **UI**: User interface components and styling
- **Integration**: Third-party service integrations

## Core Plugins

### base

**Essential monorepo foundation**

- **ID**: `base`
- **Category**: Core
- **Dependencies**: None
- **Description**: Next.js + NestJS monorepo with Turborepo

**What it provides**:
- Monorepo structure with apps/ and packages/
- Turborepo configuration
- Package.json workspace setup
- Basic scripts and tooling
- Git initialization

**Configuration**: None (always included)

---

### typescript

**TypeScript configuration**

- **ID**: `typescript`
- **Category**: Core
- **Dependencies**: `base`
- **Description**: Shared TypeScript configurations

**What it provides**:
- Shared tsconfig packages
- Strict mode by default
- Path aliases configuration
- Type checking setup

**Configuration**:
```typescript
{
  strictMode: boolean;      // Default: true
  paths: Record<string, string>;  // Custom path aliases
}
```

---

### turborepo

**Monorepo build system**

- **ID**: `turborepo`
- **Category**: Core
- **Dependencies**: `base`
- **Description**: Optimized monorepo builds and caching

**What it provides**:
- Turbo configuration
- Pipeline definitions
- Cache strategies
- Parallel execution

**Configuration**:
```typescript
{
  cache: boolean;          // Default: true
  remoteCache: boolean;    // Default: false
}
```

## Feature Plugins

### orpc

**Type-safe RPC framework**

- **ID**: `orpc`
- **Category**: Feature
- **Dependencies**: `base`, `typescript`
- **Optional Dependencies**: `better-auth`
- **Conflicts**: `rest-api`, `graphql`

**What it provides**:
- ORPC server setup in API
- ORPC client setup in Web
- Type-safe API contracts package
- Automatic type generation
- React Query integration
- OpenAPI generation

**Configuration**:
```typescript
{
  enableOpenAPI: boolean;        // Default: true
  enableValidation: boolean;     // Default: true
  clientPort: number;            // Default: 3001
  generateClient: boolean;       // Default: true
}
```

**Example Usage**:
```typescript
// API: Define procedure
export const userProcedure = orpc
  .input(z.object({ id: z.string() }))
  .output(z.object({ name: z.string(), email: z.string() }))
  .handler(async ({ input }) => {
    return await db.user.findOne(input.id);
  });

// Web: Use generated client
const { data } = useUser({ id: '123' });
```

---

### better-auth

**Modern authentication system**

- **ID**: `better-auth`
- **Category**: Feature
- **Dependencies**: `base`, `database`
- **Optional Dependencies**: `redis`, `email`

**What it provides**:
- Better Auth setup in API
- Auth client in Web
- Pre-configured auth routes
- Session management
- Multiple auth providers
- Role-based access control

**Configuration**:
```typescript
{
  providers: string[];           // ['credentials', 'google', 'github']
  sessionExpiry: string;         // Default: '7d'
  enableMFA: boolean;            // Default: false
  enableEmailVerification: boolean; // Default: true
}
```

**Supported Providers**:
- Credentials (Email/Password)
- Google OAuth
- GitHub OAuth
- Microsoft OAuth
- Facebook OAuth
- Twitter OAuth
- Discord OAuth

**Example Usage**:
```typescript
// Sign in
await signIn.email({
  email: 'user@example.com',
  password: 'password'
});

// Get session
const { data: session } = useSession();

// Sign out
await signOut();
```

---

### database

**PostgreSQL with Drizzle ORM**

- **ID**: `database`
- **Category**: Feature
- **Dependencies**: `base`, `typescript`
- **Optional Dependencies**: `docker`

**What it provides**:
- PostgreSQL setup
- Drizzle ORM configuration
- Database migrations
- Schema definitions
- Connection pooling
- Database CLI commands

**Configuration**:
```typescript
{
  type: 'postgres' | 'mysql' | 'sqlite';  // Default: 'postgres'
  host: string;                            // Default: 'localhost'
  port: number;                            // Default: 5432
  name: string;                            // Default: project name
  migrations: boolean;                     // Default: true
}
```

**Example Usage**:
```typescript
// Define schema
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow()
});

// Query
const allUsers = await db.select().from(users);

// Insert
await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com'
});
```

---

### redis

**Redis caching layer**

- **ID**: `redis`
- **Category**: Feature
- **Dependencies**: `base`
- **Optional Dependencies**: `docker`

**What it provides**:
- Redis setup
- Cache service wrapper
- Session storage
- Rate limiting
- Queue support

**Configuration**:
```typescript
{
  host: string;              // Default: 'localhost'
  port: number;              // Default: 6379
  password?: string;
  database: number;          // Default: 0
}
```

**Example Usage**:
```typescript
// Cache service
await cache.set('key', value, { ttl: 3600 });
const value = await cache.get('key');

// Session storage
await sessionStore.set(sessionId, sessionData);

// Rate limiting
const limited = await rateLimiter.check(userId);
```

---

### job-queue

**Bull queue system**

- **ID**: `job-queue`
- **Category**: Feature
- **Dependencies**: `base`, `redis`

**What it provides**:
- Bull queue setup
- Job processor framework
- Queue monitoring
- Job scheduling
- Retry logic
- Priority queues

**Configuration**:
```typescript
{
  queues: string[];          // Queue names
  concurrency: number;       // Default: 5
  retries: number;          // Default: 3
  enableUI: boolean;        // Default: true in dev
}
```

**Example Usage**:
```typescript
// Define job processor
@Processor('email')
export class EmailProcessor {
  @Process('send')
  async sendEmail(job: Job<EmailData>) {
    await this.emailService.send(job.data);
  }
}

// Add job to queue
await emailQueue.add('send', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Welcome to our app'
});
```

---

### event-system

**Event-driven architecture**

- **ID**: `event-system`
- **Category**: Feature
- **Dependencies**: `base`
- **Optional Dependencies**: `redis`

**What it provides**:
- Event bus implementation
- Event handlers
- Event sourcing patterns
- CQRS support
- Event persistence

**Configuration**:
```typescript
{
  persistence: boolean;      // Default: false
  transport: 'memory' | 'redis';  // Default: 'memory'
}
```

**Example Usage**:
```typescript
// Define event
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {}
}

// Event handler
@EventHandler(UserCreatedEvent)
export class UserCreatedHandler {
  async handle(event: UserCreatedEvent) {
    await this.emailService.sendWelcome(event.email);
  }
}

// Emit event
await eventBus.emit(new UserCreatedEvent('123', 'user@example.com'));
```

---

### file-upload

**File management system**

- **ID**: `file-upload`
- **Category**: Feature
- **Dependencies**: `base`
- **Optional Dependencies**: `database`

**What it provides**:
- File upload endpoints
- Storage backends (local, S3, CloudFlare R2)
- Image processing
- File validation
- CDN integration

**Configuration**:
```typescript
{
  storage: 'local' | 's3' | 'r2';     // Default: 'local'
  maxSize: number;                     // Default: 10MB
  allowedTypes: string[];              // Default: ['image/*']
  imageProcessing: boolean;            // Default: true
}
```

**Example Usage**:
```typescript
// Upload file
const file = await upload.single('avatar');

// Process image
const thumbnail = await imageProcessor.resize(file, {
  width: 200,
  height: 200
});

// Get URL
const url = await storage.getUrl(file.key);
```

---

### email

**Email service**

- **ID**: `email`
- **Category**: Feature
- **Dependencies**: `base`
- **Optional Dependencies**: `job-queue`

**What it provides**:
- Email service setup
- Template engine
- SMTP configuration
- Email providers (SendGrid, Resend, Mailgun)
- Queue integration

**Configuration**:
```typescript
{
  provider: 'smtp' | 'sendgrid' | 'resend' | 'mailgun';
  from: string;                        // Default sender
  templates: boolean;                  // Default: true
}
```

**Example Usage**:
```typescript
// Send email
await email.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
  data: { name: 'John' }
});

// Send transactional email
await email.sendTransactional('password-reset', {
  to: user.email,
  data: { resetLink }
});
```

---

### webhooks

**Webhook management**

- **ID**: `webhooks`
- **Category**: Feature
- **Dependencies**: `base`, `database`
- **Optional Dependencies**: `job-queue`

**What it provides**:
- Webhook registration
- Webhook delivery
- Retry logic
- Signature verification
- Webhook logs

**Configuration**:
```typescript
{
  retries: number;           // Default: 3
  timeout: number;           // Default: 5000ms
  signatureAlgorithm: string; // Default: 'sha256'
}
```

---

### search

**Full-text search**

- **ID**: `search`
- **Category**: Feature
- **Dependencies**: `base`, `database`

**What it provides**:
- PostgreSQL full-text search
- Search indexing
- Faceted search
- Search analytics

**Configuration**:
```typescript
{
  engine: 'postgres' | 'elasticsearch';  // Default: 'postgres'
  indexing: 'realtime' | 'batch';        // Default: 'realtime'
}
```

---

### i18n

**Internationalization**

- **ID**: `i18n`
- **Category**: Feature
- **Dependencies**: `base`

**What it provides**:
- Multi-language support
- Translation management
- Locale detection
- Date/number formatting

**Configuration**:
```typescript
{
  defaultLocale: string;     // Default: 'en'
  locales: string[];         // Supported languages
  fallbackLocale: string;    // Default: 'en'
}
```

## Infrastructure Plugins

### docker

**Docker containerization**

- **ID**: `docker`
- **Category**: Infrastructure
- **Dependencies**: `base`

**What it provides**:
- Development Dockerfiles
- Production Dockerfiles
- Docker Compose configurations
- Multi-stage builds
- Optimized images

**Configuration**:
```typescript
{
  nodeVersion: string;           // Default: '20'
  includeRedis: boolean;         // Default: false
  includePostgres: boolean;      // Default: false
  productionOptimized: boolean;  // Default: true
}
```

---

### ci-cd

**Continuous Integration/Deployment**

- **ID**: `ci-cd`
- **Category**: Infrastructure
- **Dependencies**: `base`
- **Optional Dependencies**: `docker`, `testing`

**What it provides**:
- GitHub Actions workflows
- CI pipelines
- CD pipelines
- Automated testing
- Deployment automation

**Configuration**:
```typescript
{
  platform: 'github' | 'gitlab' | 'circleci';  // Default: 'github'
  runTests: boolean;                            // Default: true
  runLint: boolean;                             // Default: true
  deploy: boolean;                              // Default: false
}
```

---

### monitoring

**Application monitoring**

- **ID**: `monitoring`
- **Category**: Infrastructure
- **Dependencies**: `base`

**What it provides**:
- Health check endpoints
- Metrics collection
- Error tracking (Sentry)
- Performance monitoring
- Logging infrastructure

**Configuration**:
```typescript
{
  errorTracking: 'sentry' | 'none';     // Default: 'sentry'
  metrics: boolean;                      // Default: true
  logging: 'winston' | 'pino';          // Default: 'pino'
}
```

---

### testing

**Testing framework**

- **ID**: `testing`
- **Category**: Infrastructure
- **Dependencies**: `base`, `typescript`

**What it provides**:
- Vitest setup
- Testing utilities
- Test fixtures
- Coverage reporting
- E2E testing setup

**Configuration**:
```typescript
{
  framework: 'vitest' | 'jest';         // Default: 'vitest'
  coverage: boolean;                     // Default: true
  e2e: boolean;                          // Default: false
}
```

## UI Plugins

### shadcn-ui

**UI component library**

- **ID**: `shadcn-ui`
- **Category**: UI
- **Dependencies**: `base`, `tailwind`

**What it provides**:
- Shadcn UI setup
- Component library
- Accessible components
- Customizable themes

**Configuration**:
```typescript
{
  components: string[];          // Components to install
  theme: 'default' | 'custom';   // Default: 'default'
  darkMode: boolean;             // Default: true
}
```

---

### tailwind

**Tailwind CSS**

- **ID**: `tailwind`
- **Category**: UI
- **Dependencies**: `base`

**What it provides**:
- Tailwind CSS setup
- Shared configuration
- Custom utilities
- Responsive design system

**Configuration**:
```typescript
{
  version: number;               // Default: 4
  plugins: string[];             // Tailwind plugins
}
```

---

### theme

**Theming system**

- **ID**: `theme`
- **Category**: UI
- **Dependencies**: `base`, `tailwind`

**What it provides**:
- Dark mode support
- Theme switching
- CSS variables
- Theme persistence

**Configuration**:
```typescript
{
  defaultTheme: 'light' | 'dark' | 'system';  // Default: 'system'
  themes: string[];                            // Available themes
}
```

## Integration Plugins

### stripe

**Stripe payments**

- **ID**: `stripe`
- **Category**: Integration
- **Dependencies**: `base`
- **Optional Dependencies**: `database`, `webhooks`

**What it provides**:
- Stripe SDK setup
- Payment endpoints
- Webhook handling
- Subscription management

---

### analytics

**Analytics integration**

- **ID**: `analytics`
- **Category**: Integration
- **Dependencies**: `base`

**What it provides**:
- Google Analytics
- Plausible Analytics
- Custom event tracking
- Privacy-focused analytics

---

### seo

**SEO optimization**

- **ID**: `seo`
- **Category**: Integration
- **Dependencies**: `base`

**What it provides**:
- Meta tags management
- Sitemap generation
- Robots.txt
- OpenGraph tags
- Schema.org markup

## Dependency Graph

```
base (Core)
├── typescript (Core)
├── turborepo (Core)
├── docker (Infrastructure)
├── database (Feature)
│   ├── better-auth (Feature)
│   │   └── email? (Feature)
│   ├── file-upload (Feature)
│   └── webhooks (Feature)
├── redis (Feature)
│   ├── job-queue (Feature)
│   └── event-system (Feature)
├── orpc (Feature)
│   └── better-auth? (Feature)
├── tailwind (UI)
│   ├── shadcn-ui (UI)
│   └── theme (UI)
├── testing (Infrastructure)
├── ci-cd (Infrastructure)
├── monitoring (Infrastructure)
└── search (Feature)
```

## Selection Guidelines

### Minimal Setup
```
- base
- typescript
- turborepo
```

### Basic SaaS Application
```
- base
- typescript
- turborepo
- database
- orpc
- better-auth
- tailwind
- shadcn-ui
- docker
```

### Full-Featured SaaS
```
- base
- typescript
- turborepo
- database
- redis
- orpc
- better-auth
- job-queue
- event-system
- email
- file-upload
- tailwind
- shadcn-ui
- theme
- docker
- ci-cd
- monitoring
- testing
```

### API-Only Backend
```
- base
- typescript
- database
- redis
- orpc
- better-auth
- job-queue
- docker
- testing
```

## Plugin Compatibility Matrix

| Plugin | Compatible With | Conflicts With |
|--------|----------------|----------------|
| orpc | All | rest-api, graphql |
| better-auth | All | custom-auth |
| database | All | - |
| redis | All | - |
| job-queue | redis | - |
| event-system | redis? | - |
| docker | All | - |

## Next Steps

- Review [CLI Interface](./04-CLI-INTERFACE.md) for usage
- Study [Dependency Resolution](./07-DEPENDENCY-RESOLUTION.md) for how dependencies work
- Read [Use Cases](./12-USE-CASES.md) for practical examples

---

*This catalog will grow as new plugins are developed.*
