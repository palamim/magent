# magent — point it at a codebase, get one small thing to fix

You give it a folder. It reads your source files and asks Claude to find **one concrete, safe improvement** — a dead variable, a leftover log, a tiny cleanup. Not a roadmap. Not a refactor. One thing.

Approve it, and magent commits it to a new branch leaving your main untouched.

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
2. Walks the project directory, collecting source files (`.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.md`, `.json`, `.astro`)
3. Sends the codebase to `claude-haiku-4-5`
4. Prints one proposal — type, file, proposal and a colored line-by-line diff of the change
5. Asks if you wanna apply the change (y/n)
6. If 'y': creates a branch (`type/slug`), applies the change, and commits it with a `type: description` message
7. Offers to open the branch in VS Code or Ghostty, or finish and return to main

That's it.
