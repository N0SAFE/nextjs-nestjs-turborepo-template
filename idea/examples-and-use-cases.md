# Examples and Use Cases

## Overview

This document provides real-world examples of how to use the modular monorepo system for different project types, team structures, and business requirements. Each example includes the specific modules used, configuration details, and progression paths.

## Project Type Examples

### 1. E-commerce Platform

**Requirements**: 
- Customer-facing storefront
- Admin dashboard
- Content management
- Payment processing
- Inventory management

**Module Selection**:
```bash
# Foundation
modular init ecommerce-platform
modular add @modular/foundation @modular/typescript @modular/eslint

# Frontend: Next.js storefront
modular add @modular/nextjs --name storefront
modular add @modular/tailwind @modular/ui-shadcn

# Backend: Directus CMS + API
modular add @modular/directus
modular add @modular/postgres @modular/redis

# Authentication & Payments
modular add @modular/auth-nextauth
modular add @modular/payments-stripe
modular add @modular/email-resend

# Shared packages
modular add @modular/types @modular/utils @modular/validation
```

**Project Structure**:
```
ecommerce-platform/
├── apps/
│   ├── storefront/         # Next.js customer app
│   ├── admin/              # React admin dashboard  
│   └── api/                # Directus backend
├── packages/
│   ├── ui/                 # Shared components
│   ├── types/              # TypeScript definitions
│   ├── payments/           # Payment utilities
│   └── inventory/          # Inventory management
└── docker-compose.yml      # Development environment
```

**Progressive Development**:
```bash
# Week 1: Basic setup
modular add @modular/nextjs @modular/directus

# Week 2: Add styling and components
modular add @modular/tailwind @modular/ui-shadcn

# Week 3: Authentication
modular add @modular/auth-nextauth

# Week 4: Payment integration
modular add @modular/payments-stripe

# Week 5: Admin dashboard
modular add @modular/nextjs --name admin
```

### 2. SaaS Application

**Requirements**:
- Multi-tenant architecture
- API-first approach
- Real-time features
- Advanced authentication
- Analytics and monitoring

**Module Selection**:
```bash
# Foundation + TypeScript
modular init saas-app
modular add @modular/foundation @modular/typescript

# API: NestJS with microservices
modular add @modular/nestjs
modular add @modular/prisma @modular/postgres
modular add @modular/redis @modular/graphql

# Frontend: Next.js dashboard
modular add @modular/nextjs
modular add @modular/ui-shadcn @modular/tailwind

# Authentication & Authorization
modular add @modular/auth-auth0  # Enterprise SSO
modular add @modular/rbac        # Role-based access

# Real-time & Analytics
modular add @modular/websockets
modular add @modular/analytics-mixpanel
modular add @modular/monitoring-sentry

# Testing & Deployment
modular add @modular/testing-vitest
modular add @modular/docker @modular/k8s
```

**Architecture Highlights**:
- Event-driven microservices
- GraphQL federation
- Multi-database per tenant
- Real-time subscriptions
- Comprehensive monitoring

### 3. Content Publishing Platform

**Requirements**:
- Editorial workflow
- Multi-language content
- SEO optimization
- Fast content delivery
- Mobile-responsive design

**Module Selection**:
```bash
# Content-first setup
modular init publishing-platform
modular add @modular/foundation

# Frontend: Nuxt.js for SEO
modular add @modular/nuxtjs
modular add @modular/nuxt-content
modular add @modular/ui-vuetify

# CMS: Strapi for editorial features
modular add @modular/strapi
modular add @modular/postgres

# SEO & Performance
modular add @modular/seo-meta
modular add @modular/image-optimization
modular add @modular/cdn-cloudinary

# Editorial workflow
modular add @modular/workflow-approval
modular add @modular/i18n
modular add @modular/preview-mode
```

**Content Workflow**:
1. Writers create content in Strapi
2. Editors review and approve
3. Content published to Nuxt.js frontend
4. SEO metadata auto-generated
5. Images optimized via CDN

### 4. Mobile App Backend

**Requirements**:
- RESTful APIs
- Push notifications
- File uploads
- User management
- Real-time chat

**Module Selection**:
```bash
# API-focused setup
modular init mobile-backend
modular add @modular/foundation @modular/typescript

# Backend: AdonisJS for rapid development
modular add @modular/adonisjs
modular add @modular/postgres @modular/redis

# Mobile-specific features
modular add @modular/auth-jwt
modular add @modular/push-notifications
modular add @modular/file-uploads-s3
modular add @modular/real-time-chat

# Documentation & Testing
modular add @modular/swagger
modular add @modular/postman
modular add @modular/testing-supertest
```

**API Design**:
- JWT-based authentication
- RESTful resource endpoints
- WebSocket for real-time features
- File upload with S3 integration
- Push notification service

## Team Structure Examples

### 1. Small Startup Team (3-5 developers)

**Approach**: Start minimal, add complexity as needed

```bash
# Day 1: MVP setup
modular init startup-mvp
modular add @modular/nextjs @modular/supabase

# Week 2: Add authentication
modular add @modular/auth-supabase

# Month 2: Custom backend
modular remove @modular/supabase
modular add @modular/directus @modular/postgres

# Month 6: Scale frontend
modular add @modular/ui-shadcn @modular/testing-vitest
```

**Benefits**:
- Fast initial development
- Easy to understand and maintain
- Clear upgrade paths
- Minimal configuration overhead

### 2. Enterprise Development Team (20+ developers)

**Approach**: Standardized, well-tested, enterprise-ready

```bash
# Enterprise foundation
modular init enterprise-app
modular add @modular/foundation @modular/typescript

# Multiple applications
modular add @modular/nextjs --name customer-portal
modular add @modular/angular --name admin-dashboard  
modular add @modular/nestjs --name api-gateway

# Enterprise features
modular add @modular/auth-auth0     # SSO integration
modular add @modular/rbac           # Role-based access
modular add @modular/audit-logging  # Compliance
modular add @modular/monitoring-datadog

# Development workflow
modular add @modular/testing-comprehensive
modular add @modular/ci-cd-github-actions
modular add @modular/deployment-k8s
```

**Team Benefits**:
- Consistent development standards
- Shared component libraries
- Automated testing and deployment
- Compliance and security built-in

### 3. Agency/Consulting Team

**Approach**: Template-based, client-adaptable

```bash
# Create reusable templates
modular template create agency-webapp \
  @modular/nextjs @modular/directus @modular/auth-nextauth

modular template create agency-marketing \
  @modular/nuxtjs @modular/strapi @modular/seo-optimization

# Client project setup
modular init client-project --template agency-webapp
modular add @modular/branding-custom
modular add @modular/analytics-client-specific
```

**Agency Benefits**:
- Faster project delivery
- Consistent quality across projects
- Easy client customization
- Reusable components and patterns

## Industry-Specific Examples

### 1. Healthcare Application

**Compliance Requirements**: HIPAA, data encryption, audit trails

```bash
modular init healthcare-app
modular add @modular/foundation @modular/typescript

# Secure backend
modular add @modular/nestjs
modular add @modular/postgres-encrypted
modular add @modular/auth-healthcare # HIPAA-compliant auth

# Security & Compliance
modular add @modular/encryption-at-rest
modular add @modular/audit-logging
modular add @modular/security-headers
modular add @modular/data-anonymization

# Frontend with accessibility
modular add @modular/nextjs
modular add @modular/ui-accessible # WCAG compliant
modular add @modular/healthcare-forms
```

### 2. Financial Services

**Requirements**: High security, real-time data, regulatory compliance

```bash
modular init fintech-app
modular add @modular/foundation @modular/typescript

# Secure, performant backend
modular add @modular/nestjs
modular add @modular/postgres-ha # High availability
modular add @modular/redis-cluster

# Financial-specific modules
modular add @modular/auth-2fa
modular add @modular/payments-secure
modular add @modular/real-time-trading
modular add @modular/compliance-logging

# Frontend
modular add @modular/nextjs
modular add @modular/charts-financial
modular add @modular/ui-secure
```

### 3. Education Platform

**Requirements**: Multi-role users, content delivery, progress tracking

```bash
modular init education-platform
modular add @modular/foundation @modular/typescript

# Content management
modular add @modular/nuxtjs
modular add @modular/strapi
modular add @modular/video-streaming

# Education-specific features
modular add @modular/auth-multi-role # Students, teachers, admins
modular add @modular/progress-tracking
modular add @modular/assessment-engine
modular add @modular/discussion-forums

# Integrations
modular add @modular/lms-integration
modular add @modular/calendar-sync
modular add @modular/notifications-educational
```

## Migration Examples

### 1. Legacy PHP Application to Modern Stack

**Current State**: Monolithic PHP application
**Target State**: Modular Next.js + API

```bash
# Phase 1: Add modern frontend
modular init modernization-project
modular add @modular/nextjs
modular add @modular/api-proxy # Proxy to existing PHP

# Phase 2: Extract API layer
modular add @modular/nestjs
modular add @modular/database-migration # Migrate data

# Phase 3: Replace components gradually
modular add @modular/auth-modern # Replace PHP auth
modular add @modular/ui-modern   # Replace old UI

# Phase 4: Complete migration
modular remove @modular/api-proxy # Remove PHP dependency
```

### 2. Create React App to Next.js

**Migration Strategy**: Progressive enhancement

```bash
# Current CRA project
# Target: Next.js with SSR

# Step 1: Initialize Next.js alongside CRA
modular add @modular/nextjs --name web-next

# Step 2: Copy components and update
modular migrate components --from apps/web --to apps/web-next

# Step 3: Add Next.js features
modular add @modular/next-seo
modular add @modular/next-sitemap

# Step 4: Replace CRA
modular remove @modular/cra
modular rename web-next web
```

### 3. Multiple Repositories to Monorepo

**Scenario**: Consolidating 5 separate repositories

```bash
# Create new monorepo
modular init consolidated-project

# Import existing projects
modular import frontend-repo --as apps/web
modular import api-repo --as apps/api
modular import mobile-api-repo --as apps/mobile-api

# Extract shared code
modular extract-shared --type components --to packages/ui
modular extract-shared --type types --to packages/types
modular extract-shared --type utils --to packages/utils

# Standardize configurations
modular add @modular/eslint-unified
modular add @modular/typescript-unified
```

## Performance Optimization Examples

### 1. High-Traffic E-commerce Site

**Performance Requirements**: Sub-second page loads, 10k+ concurrent users

```bash
modular init high-performance-ecommerce

# Performance-focused frontend
modular add @modular/nextjs
modular add @modular/performance-monitoring
modular add @modular/image-optimization
modular add @modular/cdn-integration

# Scalable backend
modular add @modular/nestjs
modular add @modular/caching-redis
modular add @modular/database-read-replicas
modular add @modular/load-balancer

# Optimization features
modular add @modular/lazy-loading
modular add @modular/bundle-optimization
modular add @modular/prefetching
```

### 2. Global SaaS Application

**Requirements**: Multi-region deployment, edge caching

```bash
modular init global-saas

# Edge-optimized frontend
modular add @modular/nextjs
modular add @modular/edge-functions
modular add @modular/cdn-global

# Distributed backend
modular add @modular/nestjs
modular add @modular/database-distributed
modular add @modular/cache-distributed

# Global features
modular add @modular/geolocation
modular add @modular/multi-region-deployment
modular add @modular/edge-caching
```

## Development Workflow Examples

### 1. Feature-Branch Workflow

```bash
# Create feature branch
git checkout -b feature/payment-integration

# Add required modules for feature
modular add @modular/payments-stripe
modular add @modular/webhook-handling

# Develop feature
npm run dev

# Test feature
modular test @modular/payments-stripe
npm run test:integration

# Validate before merge
modular validate
modular check-compatibility
```

### 2. Microservice Development

```bash
# Create new microservice
modular add @modular/nestjs --name payment-service

# Add service-specific modules
modular add @modular/payments-processor
modular add @modular/message-queue
modular add @modular/service-discovery

# Configure service mesh
modular add @modular/istio-integration
modular add @modular/observability
```

### 3. A/B Testing Setup

```bash
# Add experimentation framework
modular add @modular/ab-testing
modular add @modular/feature-flags

# Create test variants
modular add @modular/ui-variant-a
modular add @modular/ui-variant-b

# Analytics integration
modular add @modular/analytics-experimentation
modular add @modular/statistical-analysis
```

These examples demonstrate the flexibility and power of the modular monorepo approach across different project types, team sizes, and industry requirements. Each scenario shows how modules can be combined, customized, and evolved to meet specific needs while maintaining consistency and best practices.