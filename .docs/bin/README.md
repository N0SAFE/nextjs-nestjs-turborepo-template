# Documentation Tooling (`.docs/bin`)

Scripts to validate and visualize documentation structure.

## Available scripts

- `check-doc-links.ts` — crawl markdown links and report missing files
- `generate-doc-diagram.ts` — generate Mermaid graph from docs links

## Common usage

```bash
# Validate docs hub and immediate links
bun run .docs/bin/check-doc-links.ts --file .docs/README.md --depth 2

# Validate core concepts section
bun run .docs/bin/check-doc-links.ts --file .docs/core-concepts/README.md --depth 2

# Generate a Mermaid overview of docs structure
bun run .docs/bin/generate-doc-diagram.ts --start .docs/README.md --depth 2
```

## Notes

- Run from repository root.
- Use increasing `--depth` for broader checks.
- Prefer fixing link targets instead of suppressing checks.
