# magent — point it at a codebase, get one small thing to fix

You give it a folder. It reads your source files and asks Claude to find **one concrete, safe improvement** — a dead variable, a leftover log, a tiny cleanup. Not a roadmap. Not a refactor. One thing.

## Usage

```bash
cp .env.example .env   # add your ANTHROPIC_API_KEY and a default MAGENT_PROJECT_PATH
npm install
npm run magent              # uses MAGENT_PROJECT_PATH from .env
npm run magent -- /some/other/project   # override with any path
```

## What it does

1. Picks the target: the path you pass, or `MAGENT_PROJECT_PATH` from `.env` if you pass nothing
2. Walks the project directory, collecting source files (`.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.md`, `.json`, `.astro`)
3. Sends the codebase to `claude-haiku-4-5`
4. Prints one proposal, one file path, the before and after
5. Asks if you wanna apply the change (y/n)
6. If 'y' is typed, the change is made

That's it.
