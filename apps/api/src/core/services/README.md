# Core Services

## ArcjetService

Injectable NestJS service that wraps `@repo/arcjet` for use in controllers.

### Usage

1. Add to module providers:
```typescript
import { ArcjetService } from '@/core/services/arcjet.service';

@Module({
  providers: [ArcjetService],
})
export class YourModule {}
```

2. Inject and use in controllers:
```typescript
import { ArcjetService } from '@/core/services/arcjet.service';

@Controller()
export class YourController {
  constructor(private readonly arcjetService: ArcjetService) {}

  @Implement(contract)
  handler() {
    return implement(contract)
      .use(this.arcjetService.rateLimitMiddleware({
        refillRate: 10,
        interval: '1m',
        capacity: 100
      }))
      .handler(({ input }) => {
        // Your handler logic
      });
  }
}
```

### Available Middleware Methods

- `rateLimitMiddleware(options, middlewareOptions?)` - Token bucket rate limiting
- `botProtectionMiddleware(options?, middlewareOptions?)` - Bot detection and blocking
- `shieldMiddleware(options?, middlewareOptions?)` - General attack protection
- `createMiddleware(rules, options?)` - Custom middleware with multiple rules

### Environment Variables

- `ARCJET_KEY`: Your Arcjet API key (defaults to 'test_key_dev_mode' if not set)

See `packages/utils/arcjet/README.md` for more details on available middleware.
