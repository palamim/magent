# Magent

**A human-centered agentic coding tool.**

Magent turns your intent into a plan, then orchestrates agents that build it — while you
stay in the loop, reviewing and approving as it goes.

This repo is the **brain**. It runs locally on your machine, reads and edits your project's
files, and runs git. The interface is a hosted web app that talks to your local brain.

## Quickstart

```
git clone https://github.com/palamim/magent
cd magent
npm install
cp .env.example .env # then add your Anthropic API key to .env as ANTHROPIC_API_KEY
npm run server # serves on http://localhost:7842
```

Then open the UI at **[Magent](https://www.getmagent.com/)**, and click **Retry connection**. Your browser
will ask to allow access to your local network — click **Allow**. That's it.

## What you need

- Node.js
- An [Anthropic API key](https://console.anthropic.com/) (Magent calls Claude from your
  machine, using your key — your code and key never leave your computer)

## How it works

Magent runs two agents:

- **Planner** — turns your intent into a concrete plan broken into a sequence of tasks.
- **Executor** — implements the plan one task at a time, committing each task to a separate branch.

You review and approve at each level — the plan, and every change the Executor makes.
Work happens on a separate branch and only merges into your base branch
when you decide it's done.

## Safety

- The brain runs **entirely on your machine**. Your code never leaves your computer.
- Magent works on a **separate branch**, cut from a base branch you choose
  (`main`, `master`, `dev`, or any branch). It only merges back when you approve.
- It does **not** push to your remote unless you turn that on.
- This repo is open source — read exactly what it does before you run it.

## Configuration

On first run, Magent writes a `.magent/config.json` to your project with sensible defaults
(it detects your repo's default branch). You can change the **base branch** Magent builds
from and whether it **auto-pushes** to your remote — both from the Settings panel in the UI.

## Links

- [Magent UI](https://www.getmagent.com/)
- [X](https://x.com/leopalamim)
- [Blog](https://palamim.com/)
- [Agent Patterns](https://getagentpatterns.com/)
