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

Magent runs as a pipeline of agents, checks, and review:

1. **Planner** — a Haiku agent explores the codebase with a `read_file` tool, reading what it needs across as many rounds as it takes, then produces a structured _work order_ grounded in your `magent.md`: what to change, which files, and detailed instructions.
2. **Executor** — a Sonnet agent implements the work order.
3. **Verify** — the changes are written to a fresh branch and typechecked (`tsc --noEmit`). Failures are fed back to the executor to fix, up to 3 attempts; if it still can't pass, the branch is discarded and nothing is kept.
4. **Review & refine** — the full diff is shown. You can inspect it in VS Code or Ghostty, approve it, discard it, or **refine it in plain language** ("restore the original padding", "make the heading smaller"). Each refinement re-runs through verification and updates the same branch, so you converse with the code until it's right.
5. **Commit** — each verified version is committed to the branch (`type/slug`) and folded into a single clean commit as you refine. Your `main` is never touched.

Magent never edits your working files directly and never keeps code that doesn't typecheck. Every change lives on its own branch — verified and committed — for you to keep or discard.

That's it.
