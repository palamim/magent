# Magent — point it at a codebase and it proposes, builds, and verifies the next step

Give Magent a folder and it works like an engineer who already knows the project: it explores the codebase, decides what the most valuable next step is, implements it, checks its own work, and hands you a finished change on its own branch to review. It learns from what you approve and reject, so it gets better at proposing the longer you use it.

## Intent: `magent.md`

Magent reads a `magent.md` file from the root of the target project — your description of what the project is and where it's headed. Every proposal is grounded in it: with it, Magent respects your taste and guardrails; without it, it infers direction from the code alone. No required format — write whatever steers it.

Copy `magent.md.example` into your project root and edit it to get started.

## Usage

```bash
cp .env.example .env   # add your ANTHROPIC_API_KEY and a default MAGENT_PROJECT_PATH
npm install
npm run magent                          # uses MAGENT_PROJECT_PATH from .env
npm run magent -- /some/other/project   # or point it anywhere
```

## How it works

Magent is a team of agents that propose, build, verify, and learn:

1. **The planner** explores the codebase with a `read_file` tool — reading whatever it needs, across as many rounds as it takes — then commits to one concrete next step as a structured work order, grounded in your `magent.md` and everything it has learned from past sessions.
2. **The executor** implements that work order as real code changes.
3. **The verifier** writes the changes to a fresh branch and typechecks them. If the types don't pass, the errors go back to the executor, which fixes its own work and tries again — up to three times. Code that can't be made to typecheck is never kept.
4. **You and the agents converse.** Magent shows you the full diff; you can open it in VS Code or Ghostty, approve it, discard it, or **refine it in plain language** — "restore the original padding", "make the heading smaller". Each refinement runs back through verification and updates the same branch, so you shape the change by talking to it.
5. **It remembers.** When you approve, discard, or explain a rejection, Magent records it. Next session the planner reads that history — so it stops re-proposing what you turned down, builds on what you approved, and sharpens its sense of the project over time.

Every change lives on its own branch, verified and committed as a single clean commit. Magent never edits your working files directly and never keeps code that doesn't typecheck — your `main` is always untouched.

## What Magent keeps in `.magent/`

Magent stores its per-project memory in a `.magent/` folder at the root of each project it works on. It's gitignored automatically — you don't have to manage it. Delete it to give Magent a clean slate.
