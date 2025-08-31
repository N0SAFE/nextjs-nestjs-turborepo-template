# OpenAPI and API Reference

This service exposes an OpenAPI 3.1 spec generated from the oRPC contract, and serves a Scalar API Reference UI.

- Spec JSON: `GET /openapi.json`
- Scalar UI: `GET /reference`

Local generation without running the server:

```bash
bun --bun --cwd=apps/api run openapi:print
```

This writes `apps/api/openapi.json`.

Notes:
- Spec is generated from `@repo/api-contracts` using Zod v4 converter.
- When behind Next.js (`/api/nest` rewrite), the relative server URL in the spec ensures links stay valid.
