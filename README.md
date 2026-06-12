# magent — point it at a codebase, get the next step

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

## What it does

1. Picks the target: `MAGENT_PROJECT_PATH` from `.env` or the path you pass
2. Reads `magent.md` (the project's intent) if present
3. Lists the project's source files (`.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.md`, `.json`, `.astro`) and hands that list to the model
4. The model explores agentically — it calls a `read_file` tool to read whatever files it needs, in as many rounds as it takes, deciding what to read next based on what it has learned
5. Once it understands the project, it proposes one grounded next step

## Status

Magent is mid-build, and works in stages:

1. **Planner** _(working)_ — a Haiku agent explores the codebase, reading whatever files it needs, then produces a structured _work order_: what to change, which files to touch, which to read for context, and detailed instructions.
2. **Executor** _(working)_ — a Sonnet agent takes the work order and generates the actual file changes.
3. **Review** _(working)_ — every change is shown as a colored, GitHub-style diff (new files and surgical edits to existing ones) for you to inspect.
4. **Write** _(next)_ — approving the changes and writing them to disk. Not built yet, so **nothing is written to disk** — Magent currently explores, plans, generates, and shows you the diffs to review.

That's it.
