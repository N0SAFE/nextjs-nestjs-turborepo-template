Scripts in .specify/scripts/bash/
================================

Purpose
-------
This folder contains helper scripts used by the repository's specification tooling. They are intended to be used by maintainers and CI to validate documentation and planning artifacts before implementation and PRs.

Available scripts
-----------------
- `manage-tasks.sh` — Verify and manage `tasks.md` files (format checks, reorganize, update completion status).
- `manage-requirements.sh` — Analyze `spec.md` functional requirements (FR-###) and correlate them with `tasks.md` entries. Produces a report of which FRs have related tasks and how many, plus a list of orphan tasks that mention no FR.

Where to use them (cheat-modes / common scenarios)
-------------------------------------------------
- Local pre-implementation: Run the requirements and tasks checks before starting work on a feature to ensure the spec and tasks are aligned.
  - Example: `./.specify/scripts/bash/manage-requirements.sh analyze specs/002-build-package-handler/spec.md specs/002-build-package-handler/tasks.md`
  - Example: `./.specify/scripts/bash/manage-tasks.sh verify specs/002-build-package-handler/tasks.md`

- Pre-PR / CI: Add calls to these scripts in your CI job(s) to fail builds when tasks/specs are malformed or when FRs have no coverage. Place these in the pipeline stage that validates repository docs, before build/test steps.

- Governance checks: Use `--json` output when integrating with automation that consumes reports. For human inspection, omit `--json`.

Integration ideas
-----------------
- Add a CI job `docs-check` that runs both checks across `specs/` and fails the pipeline if the verifier or requirements analyzer report issues.
- Hook into PR templates or a GitHub Action to run these tools automatically for changed `specs/**/` or `tasks.md` files.

Notes
-----
- The `manage-requirements.sh` script is intentionally conservative: it looks for explicit `FR-###` occurrences in spec files and counts task lines that reference those IDs. If your project uses a different FR notation, adjust the script's pattern matching accordingly.
