# magent — point it at a codebase, get the next step

You give it a folder. It reads your project's intent and its code, then proposes **one concrete next step** that advances where the project is headed — a feature, a craft improvement, a meaningful evolution. Grounded in your direction, never generic.

Approve it, and magent commits it to a new branch leaving your main untouched.

## Intent: `magent.md`

Magent reads a `magent.md` file from the root of the target project — your description of what the project is and where it's headed. The quality of every proposal depends on this file. No `magent.md`? Magent still runs, just without your intent to ground it.

Copy `magent.md.example` into your project root and edit it to get started.

## Usage

```bash
cp .env.example .env   # add your ANTHROPIC_API_KEY and a default MAGENT_PROJECT_PATH
npm install
npm run magent              # uses MAGENT_PROJECT_PATH from .env
npm run magent -- /some/other/project   # override with any path
```

Run it on a project with a clean working tree. Magent needs to switch branches, and git won't let it if you have uncommitted changes.

## What it does

1. Picks the target: the path you pass, or `MAGENT_PROJECT_PATH` from `.env` if you pass nothing
2. Reads `magent.md` (the project's intent) if present
3. Walks the project directory, collecting source files (`.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.md`, `.json`, `.astro`)
4. Sends the intent and code to `claude-haiku-4-5` and asks for one next step
5. Prints the proposal — type, file, and a colored diff of the change
6. Asks if you wanna apply the change (y/n)
7. If 'y': creates a branch (`type/slug`), applies the change, and commits it with a `type: description` message
8. Offers to open the branch in VS Code or Ghostty, or finish and return to main

That's it.
