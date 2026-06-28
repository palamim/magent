# Magent

**Set the direction. Magent plans and builds toward it.**

Magent is an agentic coding tool with a direction layer. You tell it where the project
should go; a Director agent sets the frontier, a Planner turns it into concrete tasks, and
an Executor implements them — each step reviewed and approved by you.

This repo is the **brain** — it runs locally on your machine, reads and edits your project's
files, and runs git. The interface is a hosted web app that talks to your local brain.

## Quickstart

\`\`\`bash
git clone https://github.com/palamim/magent
cd magent
npm install
cp .env.example .env # then add your Anthropic API key to .env as ANTHROPIC_API_KEY
npm run server # serves on http://localhost:7842
\`\`\`

Then open the UI at **[Magent](https://magentweb.netlify.app/)**, and click **Retry connection**. Your browser
will ask to allow access to your local network — click **Allow**. That's it.

## What you need

- Node.js
- An [Anthropic API key](https://console.anthropic.com/) (Magent calls Claude from your
  machine, using your key — your code and key never leave your computer)

## How it works

Magent runs three agents, each working at a higher altitude than the last:

- **Director** — sets the project's direction: one inexhaustible frontier, a direction of
  travel rather than a checklist. It reads your project's intent (an optional `MAGENT.md`)
  and what's been built, and writes the direction the Planner follows.
- **Planner** — turns the current direction into a concrete plan: a feature broken into a
  sequence of tasks.
- **Executor** — implements the plan one task at a time, committing each task to a single
  feature branch.

You review and approve at each level — the direction, the plan, and every change the
Executor makes. Work happens on a separate branch and only merges into your base branch
when you decide it's done.

## Safety

- The brain runs **entirely on your machine**. Your code never leaves your computer.
- Magent works on a **separate feature branch**, cut from a base branch you choose
  (`main`, `master`, `dev`, or any branch). It only merges back when you approve.
- It does **not** push to your remote unless you turn that on.
- This repo is open source — read exactly what it does before you run it.

## Setting direction (optional)

Magent works without setup, but it proposes sharper direction when your project has a
`MAGENT.md` in its root. See `MAGENT.example.md` for the shape — copy it, fill it in,
and the Director reads it. You don't need one to start.

## Configuration

On first run, Magent writes a `.magent/config.json` to your project with sensible defaults
(it detects your repo's default branch). You can change the **base branch** Magent builds
from and whether it **auto-pushes** to your remote — both from the Settings panel in the UI.

## Links

- [X](https://x.com/leopalamim)
- [Blog](https://palamim.com/)
- [Agent Patterns](https://agentpatterns.netlify.app/)
