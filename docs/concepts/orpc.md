# ORPC: End-to-end types

ORPC provides shared contracts between the NestJS API and the Next.js client for type-safe requests and responses.

## What it is

- Contract-first: Define routes, params, and schemas in packages/api-contracts
- Single source of truth: Server implements the contract; client consumes it
- Typed everywhere: Compiler enforces correctness across changes

## How it works here

- Contracts live in packages/api-contracts
- API implements contracts in apps/api using NestJS controllers/services
- Web consumes a generated client and React Query hooks

## Development loop

1. Edit or add a contract in packages/api-contracts
2. Implement the handler in apps/api
3. Generate client/hooks if needed by running web generation scripts (see ORPC-TYPE-CONTRACTS.md)
4. Use the typed hooks or server client in apps/web

## Error handling

- Errors are typed via contract responses
- Prefer narrow, explicit error shapes for better DX

## See also

- Reference: ../ORPC-TYPE-CONTRACTS.md
- Architecture: ../ARCHITECTURE.md
