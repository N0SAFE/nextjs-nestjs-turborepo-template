# @repo/nestjs-base

Minimal NestJS module utilities for this monorepo.

## What it provides

- `createBaseModule(...)`: creates a tiny typed NestJS module class with a `forRoot()` entrypoint.
- Shared lightweight types for providers/exports/imports wiring.

## Example

```ts
import { createBaseModule } from '@repo/nestjs-base';

export const UserModule = createBaseModule({
  moduleName: 'User',
  global: true,
  providers: [{ provide: 'USER_SERVICE', useValue: {} }],
  exports: ['USER_SERVICE'],
});

// In AppModule imports:
// UserModule.forRoot()
```
