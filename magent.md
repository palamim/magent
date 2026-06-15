## Magent

### 1. Project

- Magent is a local agentic CLI, written in TypeScript on the Anthropic SDK.
- It points at a codebase, proposes one concrete next step, implements it with a
  planner/executor split, verifies it against the typechecker, lets the builder
  refine it in plain language, and commits it to its own branch. It records what
  the builder approves and rejects so it improves across sessions.
- It is built to be understood top to bottom. Every piece is hand-written and
  reasoned about — no framework hides the loop.

### 2. Taste

- I value depth, precision, and the layer underneath. I'd rather understand the
  substrate than use an abstraction that hides it.
- Simplicity first. The smallest change that does the job. No speculative
  machinery for problems not yet observed. Build the tent before the cathedral.
- Refactor only when the current structure causes real, felt pain — never
  preemptively. Delete cruft that no longer earns its place.
- A function should be describable in one sentence. `main` should read like the
  story of the program.

### 3. Direction

**What good next steps move toward (the current frontier):**

- Richer verification signals: lint and test-running alongside the typecheck loop,
  each feeding failures back the same way. A dev-server-boots check. The verification
  rung getting deeper, not wider.
- Memory curation: a lessons-agent that reads the raw append-only history and
  reconciles it into concise, deduplicated lessons — to be built when the raw log is
  visibly noisy, not before.
- Robustness the way real use exposes it: crash-safe cleanup (try/finally around the
  loop), legible errors on git failure (dirty tree, no prior commits), graceful
  handling of non-TypeScript projects.
- Legibility and trust: anything that makes the loop easier to understand or its
  output easier to trust for a builder running it daily.

**Guardrails — don't propose these:**

- Do not refactor the core pipeline (planner → executor → verify → refine → commit)
  without a strong, specific reason rooted in observed pain.
- Do not add dependencies casually. A new library must solve a real, felt friction.
- Do not build speculative features for problems not yet observed — prefer logging
  the seam over building for it.
- Do not propose multi-agent orchestration, scheduling, or autonomy yet — those are
  later rungs; keep proposals to the current shape.
- Do not touch `.env`, secrets, or the git/commit logic without explicit reason.
- No web UI, no server, no packaging/publishing work yet.

### 4. The long arc (context, not a to-do)

Magent's eventual horizon is an orchestration system: many agents proposing,
building, and reviewing in parallel across git worktrees; scheduled, semi-autonomous
runs that propose work while I sleep; Magent improving Magent in a loop. That is the
direction the project is ultimately walking toward.

This section exists so you understand the trajectory you're part of — NOT as a
backlog. Do not propose orchestration, scheduling, autonomy, or multi-agent work.
Each of those is a later rung that must be earned by the current single-agent loop
becoming trustworthy and well-understood first. Propose the next concrete step on
THAT path, not leaps toward the horizon.
