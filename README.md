# Magent

**Set the direction. Magent plans and builds toward it.**

Magent is an agentic coding tool with a direction layer. You tell it where the project
should go; a Director agent sets the frontier, a Planner turns it into concrete tasks, and
an Executor implements them — each step reviewed and approved by you.

This repo is the **brain** — it runs locally on your machine, reads and edits your project's
files, and runs git. The interface is a hosted web app that talks to your local brain.

## Quickstart

```bash
git clone https://github.com/palamim/magent
cd magent
npm install
cp .env.example .env        # then add your Anthropic API key to .env as ANTHROPIC_API_KEY
npm run server              # serves on http://localhost:7842
```

Then open the UI at **[Magent](https://magentweb.netlify.app/)**, and click **Retry connection**. Your browser
will ask to allow access to your local network — click **Allow**. That's it.

## What you need

- Node.js
- An [Anthropic API key](https://console.anthropic.com/) (Magent calls Claude from your
  machine, using your key — your code and key never leave your computer)

## How it works

Magent runs three agents, each above the last:

- **Director** — sets the project's direction (the next ~3 features), reading your project's
  long-term intent (`MAGENT.md`) and the history of what's been built. It writes the
  direction the Planner follows.
- **Planner** — turns the current direction into one concrete, shippable task.
- **Executor** — implements the task on a fresh git branch.

You review and approve at each level. Nothing is committed to your main branch until you
approve it, and Magent never pushes to your remote unless you turn that on.

## Safety

- The brain runs **entirely on your machine**. Your code never leaves your computer.
- Magent works on a **separate branch** and only merges to `main` when you approve.
- It does **not** push to your remote by default.
- This repo is open source — read exactly what it does before you run it.

## Setting direction (optional)

Magent works without setup, but it proposes sharper direction when your project has a
`MAGENT.md` in its root. See `MAGENT.example.md` for the shape — copy it, fill it in,
and the Director reads it. You don't need one to start.

## Links

- [X](https://x.com/leopalamim)
- [Blog](https://palamim.com/)
- [Agent Patterns](https://agentpatterns.netlify.app/)
