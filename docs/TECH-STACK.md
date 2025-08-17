# Technology Stack

> Scope: Technologies chosen for a Docker-first SaaS workflow with Next.js + NestJS, ORPC for end-to-end types, and Render as a target platform.

This document provides a detailed overview of the technologies used in this monorepo template and explains the reasoning behind these choices.

## Core Technologies

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 15.x | React framework for server-rendered applications |
| [React](https://reactjs.org/) | 19.0.0 | JavaScript library for building user interfaces |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first CSS framework |
| [Shadcn UI](https://ui.shadcn.com/) | Latest | Component library built on Radix UI and Tailwind |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Typed JavaScript |
| [React Query](https://tanstack.com/query) | 5.x | Data fetching and caching library |
| [Zod](https://zod.dev/) | 4.0.0 | Type-safe schema validation |
| [Zustand](https://github.com/pmndrs/zustand) | 5.x | State management |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| [NestJS](https://nestjs.com/) | 10.x | Node.js framework for scalable server-side applications |
| [ORPC](https://orpc.io/) | ^1.7.8 | Type-safe RPC framework for end-to-end type safety |
| [Better Auth](https://better-auth.com/) | ^1.3.4 | Modern authentication library with session management |
| [Drizzle ORM](https://orm.drizzle.team/) | ^0.39.3 | TypeScript ORM for PostgreSQL |
| [PostgreSQL](https://www.postgresql.org/) | 16 | Relational database |
| [Redis](https://redis.io/) | Latest | In-memory data structure store for caching |

### DevOps & Tooling

| Technology | Version | Purpose |
|------------|---------|---------|
| [Turborepo](https://turbo.build/) | 2.x | Monorepo build system |
| [Docker](https://www.docker.com/) | Latest | Containerization platform |
| [Docker Compose](https://docs.docker.com/compose/) | Latest | Multi-container Docker applications |
| [ESLint](https://eslint.org/) | Latest | JavaScript/TypeScript linter |
| [Prettier](https://prettier.io/) | Latest | Code formatter |

## Why These Technologies?

### Next.js & React

Next.js 15.1 with React 19 provides the latest features for modern web development:

- **Server Components**: Excellent performance and SEO benefits
- **App Router**: Modern file-based routing with nested layouts
- **Edge Runtime Support**: Global distribution with minimal latency
- **TypeScript Integration**: Built-in TypeScript support
- **Image Optimization**: Built-in image optimization
- **API Routes**: Serverless API endpoints
- **Incremental Static Regeneration**: Dynamic content with static performance

### NestJS

NestJS serves as the backend framework with several advantages:

- **Scalable Architecture**: Modular architecture with dependency injection
- **TypeScript First**: Built with TypeScript for better developer experience  
- **ORPC Integration**: Seamless integration with ORPC for type-safe APIs
- **Extensibility**: Rich ecosystem of modules and decorators
- **Enterprise Ready**: Production-ready with built-in features like guards, interceptors
- **Self-contained**: No external CMS dependency in this template

### Turborepo

Turborepo provides the monorepo structure with benefits like:

- **Optimized Builds**: Intelligent caching for faster builds
- **Parallel Execution**: Run tasks across packages in parallel
- **Dependency Management**: Simplified management of internal dependencies
- **Consistent Configuration**: Share configuration across packages

### Shadcn UI & Tailwind CSS

This UI approach offers flexibility and aesthetics:

- **Component Library**: Pre-built accessible components
- **Utility-first CSS**: Rapid styling without writing custom CSS
- **Customizable**: Full control over component implementation
- **No Runtime**: Components are copied into your project, not imported as a dependency
- **Themeable**: Easy dark mode and custom theming
- **Accessibility**: Built with accessibility in mind

### Docker & Docker Compose

Containerization provides consistency across environments:

- **Environment Consistency**: Same environment in development and production
- **Isolation**: Each service runs in its own container
- **Scalability**: Easy scaling of individual services
- **Configuration**: Environment variables for different deployment scenarios
- **Portability**: Run anywhere Docker is supported

### TypeScript

TypeScript provides type safety across the entire application:

- **Type Safety**: Catch errors at compile time
- **Developer Experience**: Better tooling and autocompletion
- **Documentation**: Types serve as documentation
- **Scalability**: Easier maintenance for large codebases

### React Query

Data fetching and state management:

- **Caching**: Intelligent caching reduces API calls
- **Background Refresh**: Keep data fresh without affecting user experience
- **Error Handling**: Built-in error states
- **Pagination & Infinite Scrolling**: Built-in support
- **Prefetching**: Improve perceived performance
- **Server-Side Rendering**: Works well with Next.js

### Better Auth

Authentication solution:

- **Modern Architecture**: Serverless-first, edge-compatible design
- **Type Safety**: Full TypeScript support throughout
- **Multiple Providers**: Social logins, email/password, magic links
- **Session Management**: Secure session handling with multiple storage options
- **Framework Agnostic**: Works with any framework, not just Next.js
- **Developer Experience**: Simple setup with sensible defaults

## Performance Considerations

The tech stack is optimized for performance:

- **SSR/SSG**: Server-rendered and statically generated pages for optimal loading
- **Edge Runtime**: Deploy to edge locations for minimal latency
- **Code Splitting**: Automatic code splitting for smaller bundles
- **Image Optimization**: Automatic image optimization
- **Caching**: Multiple layers of caching (Browser, CDN, React Query, Redis)
- **Turborepo Caching**: Avoid redundant builds
- **Lazy Loading**: Load components and data only when needed

## Security Considerations

Security best practices are implemented:

- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Granular permissions in NestJS
- **Environment Variables**: Secure storage of sensitive information
- **HTTPS**: Encrypted communication
- **Content Security Policy**: Protection against XSS attacks
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Zod schema validation

## Upgrading Dependencies

This monorepo template is designed to make dependency upgrades easier:

- **Turborepo Workspaces**: Update shared packages in one place
- **Package Versioning**: Consistent versioning across packages
- **Containerization**: Isolate environment-specific dependencies

For specific upgrade instructions, refer to the documentation of each technology.
