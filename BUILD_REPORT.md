# AgentRun Ledger Build Report

## What Was Implemented

- TypeScript/Node CLI named `agentrun`
- SQLite persistence using Node's built-in `node:sqlite`
- Git repository checks, status, diff, diff stat, branch, and commit helpers
- Session lifecycle with active session tracking
- Manual before/after snapshots
- Logged shell command execution with stdout, stderr, exit code, and duration
- Human notes
- Deterministic review heuristics
- Markdown report generation under `.agentrun/reports/`
- Local Express dashboard API
- React/Vite dashboard with session list, details, file changes, command timeline, notes, and report preview
- Test suite covering DB, Git, command runner, session service, review heuristics, report generation, and CLI
- README with usage, development, testing, and linking instructions

## Commands Run

```bash
npm.cmd install
npm.cmd test
npm.cmd run build
npm.cmd run build
```

Manual smoke commands were run in fresh temporary Git repositories using the built CLI:

```bash
node dist/cli/index.js init
node dist/cli/index.js start "smoke test"
node dist/cli/index.js note "hello"
node dist/cli/index.js run "node index.js"
node dist/cli/index.js report
node dist/cli/index.js status
node dist/cli/index.js dashboard --port 48766
```

## Test Results

- `npm.cmd test`: passed, 7 test files, 42 tests

## Build Results

- `npm.cmd run build`: passed
- TypeScript compilation passed
- Vite dashboard build passed

## Manual Smoke Results

- CLI initialization created `.agentrun/agentrun.db`
- Session start created an active session
- Note was recorded
- Command logging captured a passing `node index.js` run
- Report was generated at `.agentrun/reports/session-1.md`
- Status showed command and changed-file summary
- Dashboard API responded with HTTP 200 at `/api/sessions`

## Known Limitations

- Node prints an experimental warning for `node:sqlite`.
- The dashboard is intentionally lightweight and local-only.
- The command runner captures command output but does not provide full terminal recording.
- Review risks are deterministic heuristics, not LLM-generated analysis.
- A dedicated `close` command is not part of this MVP spec.

## How To Run

```bash
npm install
npm run build
npm run dev -- init
npm run dev -- start "demo session"
npm run dev -- note "first note"
npm run dev -- run "node -e \"console.log('hello')\""
npm run dev -- report
npm run dev -- dashboard
```

For global local testing:

```bash
npm link
agentrun init
```

## Intentionally Deferred

- Browser automation
- Deep integrations with Codex, Claude, Cursor, Gemini, or terminals
- Cloud sync and multi-user accounts
- Tamper-proofing
- Paid LLM summarization
