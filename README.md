# magent — point it at a codebase, get one small thing to fix

You give it a folder. It reads your source files and asks Claude to find **one concrete, safe improvement** — a dead variable, a leftover log, a tiny cleanup. Not a roadmap. Not a refactor. One thing.

## Usage

```bash
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm install
npm run magent -- /path/to/your/project
```

## What it does

1. Walks the project directory, collecting source files (`.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.md`, `.json`, `.astro`)
2. Sends the codebase to `claude-haiku-4-5`
3. Prints one proposal, one file path, the before and after
4. Asks if you wanna apply the change (y/n)
5. If 'y' is typed, the change is made

That's it.
