<!-- Pull Request Template: include checklist items specific to this monorepo. -->
# Pull Request Checklist

Please ensure the following before requesting review:

- [ ] I have read the relevant documentation in `docs/core-concepts/` and the feature's `specs/` files.
- [ ] My changes add or update automated tests when applicable (unit/integration).
- [ ] I ran `bun run lint` and `bun run test` locally and fixed issues.
- [ ] I added or updated documentation (`README.md`, `specs/*/quickstart.md`) where behavior changed.
- [ ] If I added any cross-service RPC endpoint, I have:
  - [ ] Authored an ORPC contract in `packages/api-contracts/` describing the request/response types, and
  - [ ] Generated and used the client/server bindings as per project conventions (`bun run web -- generate`).
- [ ] The PR description references the feature spec in `specs/` and includes testing instructions and expected outcomes.

Reviewer guidance: verify any architectural changes against the monorepo constitution in `.specify/memory/constitution.md` and `docs/core-concepts/`.
