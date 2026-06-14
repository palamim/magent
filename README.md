# Magent — Point it at a codebase and it proposes a next step, implements, and verifies

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

Magent runs as a pipeline of agents and checks:

1. **Planner** — a Haiku agent explores the codebase. It's handed the list of source files (`.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.md`, `.json`, `.astro`), then uses a `read_file` tool to read whatever it needs, in as many rounds as it takes (MAX: 10), deciding what to read next based on what it has learned. Once it understands the project, it produces a structured _work order_: what to change, which files to touch, which to read for context, and detailed instructions — grounded in your `magent.md`.
2. **Executor** — a Sonnet agent takes the work order and generates the actual file changes.
3. **Verify** — the changes are written to a fresh branch and typechecked (`tsc --noEmit`). If the types don't pass, the errors are fed back to the executor, which fixes its own work and tries again — up to 3 attempts. If it still can't produce valid code, the branch is discarded and nothing is committed.
4. **Review** — once the code typechecks, every change is shown as a colored, GitHub-style diff (new files and surgical edits to existing ones).
5. **Commit** — the verified changes are committed to the branch (`type/slug`), leaving your `main` untouched.
6. **Inspect** — Magent offers to open the branch in VS Code or Ghostty so you can run it and check the result, or finish and return to `main`.

Magent does not edit your working files directly, and it does not commit code that doesn't typecheck. Every change lands on its own branch — verified — for you to keep, refine, or discard.

That's it.
