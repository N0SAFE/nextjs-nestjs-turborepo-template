# Docs Style Guide

> Applies to all docs in the Docker-first SaaS workflow. Keep content scoped to this use case and link to primary sources to avoid duplication.

Consistent, concise, and actionable documentation makes this repo easy to work with. Follow these conventions.

## Principles

- Single source of truth: one doc per topic; others link to it
- Task vs. Concept separation: Guides say how; Concepts explain why/how it works
- Short first: lead with the gist, then details
- Copy-paste friendly commands
- Keep versions accurate; note assumptions

## Document types

- Overview: High-level maps (Architecture, Tech Stack)
- Concept: How a system works (ORPC, routing, auth, DB)
- Guide: Step-by-step tasks (Getting Started, Deployment, Testing)
- Reference: Stable details (Env vars, commands, APIs, glossary)
- Change logs / Migrations: Historical context only

## Structure

- Title: Clear and specific
- Intro: 1–2 sentences, purpose/value
- Prerequisites (only if needed)
- Steps or Sections
- Verification/Outcome
- Links to related docs

## Writing style

- Use simple, direct language
- Prefer lists over long paragraphs
- Use present tense, imperative for steps (Run, Create, Update)
- Clarify platform-specific steps (Windows CMD vs Unix)
- Avoid duplication—link instead

## Code blocks

- Use fenced code blocks with language
- One command per line
- Provide Windows `cmd` variants when relevant

## Versioning

- Update versions when upgrading stack
- If unknown, say "as configured in package.json"

## Cross-linking

- Use relative links (./path/to/doc.md)
- At the top, link to the primary doc for the topic if this file is a sub-doc

## Review checklist

- Accurate for current codebase and scripts
- Links resolve
- No duplicated content
- Commands match package scripts
- Terms match Glossary
