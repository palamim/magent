# Magent — Point it at a codebase and it proposes, implements, and commits one next step to a new branch for you to review and keep.

You give it a folder. It explores your project reading the files it decides are relevant then proposes **one concrete next step** that advances where the project is headed. Grounded in your intent.

## Intent: `magent.md`

Magent reads a `magent.md` file from the root of the target project — your description of what the project is and where it's headed. The quality of every proposal depends on this file: with it, proposals respect your taste and guardrails; without it, magent infers from the code alone. No required format — write whatever helps.

Copy `magent.md.example` into your project root and edit it to get started.

## Usage

```bash
cp .env.example .env   # add your ANTHROPIC_API_KEY and a default MAGENT_PROJECT_PATH
npm install
npm run magent              # uses MAGENT_PROJECT_PATH from .env
npm run magent -- /some/other/project   # override with any path
```

## How it works

Magent runs as a five-stage pipeline:

1. **Planner** — a Haiku agent explores the codebase. It's handed the list of source files (`.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.md`, `.json`, `.astro`), then uses a `read_file` tool to read whatever it needs, in as many rounds as it takes, deciding what to read next based on what it has learned. Once it understands the project, it produces a structured _work order_: what to change, which files to touch, which to read for context, and detailed instructions — grounded in your `magent.md`.
2. **Executor** — a Sonnet agent takes the work order and generates the actual file changes.
3. **Review** — every change is shown as a colored, GitHub-style diff (new files and surgical edits to existing ones).
4. **Apply** — changes are written to a new git branch (`type/slug`) and committed, leaving your `main` untouched.
5. **Inspect** — Magent offers to open the branch in VS Code or Ghostty so you can run it and check the result, or finish and return to `main`.

Magent does not edit your working files directly — every change lands on its own branch for you to keep, refine, or discard.

That's it.
