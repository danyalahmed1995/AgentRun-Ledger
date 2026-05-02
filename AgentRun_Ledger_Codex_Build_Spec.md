# AgentRun Ledger — Codex Build Spec

## Role
You are Codex acting as a senior TypeScript/Node.js engineer. Build the complete project described below. Do not stop after scaffolding. Implement, test, self-correct, and rerun until the project is working.

## Project Summary
Build **AgentRun Ledger**, a local-first CLI and lightweight web dashboard that records AI coding sessions.

The tool should help a developer answer:

- What did the AI agent change?
- Which files were touched?
- Which commands were run?
- Which commands passed or failed?
- What does the final diff look like?
- What should the human reviewer watch out for?
- Can I generate a clean Markdown report for this session?

This is not an enterprise observability platform. This is a practical local developer tool: **Git history + terminal command log + session notes + generated review report**.

---

## Core Product Positioning

AgentRun Ledger is a local-first session ledger for AI coding agents. It records what changed, what commands ran, what failed, what passed, and generates a clean review report so developers can trust, replay, and summarize long AI coding sessions.

The MVP should feel like a useful developer utility, not a giant dashboard cathedral.

---

## Tech Stack

Use this stack unless there is a strong technical reason not to:

- TypeScript
- Node.js
- Commander.js for CLI commands
- SQLite for local persistence
- `better-sqlite3` or a simple SQLite alternative if install issues occur
- Vite + React + Tailwind for dashboard
- Vitest for tests
- Markdown report generation
- No paid API required for MVP

Optional LLM summarization can be stubbed behind an interface, but the MVP must work fully without external API keys.

---

## Important Build Rule

Do not overbuild. The MVP must be clean, runnable, and testable.

Avoid these in v1:

- Browser automation
- Codex internal hacking
- Claude/Cursor/Gemini deep integration
- Full terminal recording
- OpenTelemetry setup
- Multi-user accounts
- Cloud sync
- Enterprise RBAC
- Cryptographic tamper-proofing
- Paid LLM dependency

---

## Expected Repository Structure

Create a clean monorepo-style structure:

```txt
agentrun-ledger/
  package.json
  tsconfig.json
  README.md
  .gitignore
  vitest.config.ts
  src/
    cli/
      index.ts
      commands/
        init.ts
        start.ts
        snapshot.ts
        run.ts
        note.ts
        status.ts
        report.ts
        list.ts
        dashboard.ts
    core/
      db.ts
      schema.ts
      git.ts
      commandRunner.ts
      reportGenerator.ts
      sessionService.ts
      types.ts
      paths.ts
      reviewHeuristics.ts
    dashboard/
      index.html
      src/
        main.tsx
        App.tsx
        api.ts
        components/
          SessionList.tsx
          SessionDetail.tsx
          FileChanges.tsx
          CommandTimeline.tsx
          ReportPreview.tsx
    server/
      dashboardServer.ts
    tests/
      db.test.ts
      git.test.ts
      commandRunner.test.ts
      sessionService.test.ts
      reportGenerator.test.ts
      cli.test.ts
```

If a simpler structure is more practical during implementation, use it, but keep the separation between CLI, core logic, tests, and dashboard.

---

## CLI Commands

The CLI binary should be called:

```bash
agentrun
```

During local development, it can run through:

```bash
npm run dev -- <command>
```

or:

```bash
npm run agentrun -- <command>
```

Implement the commands below.

---

### 1. `agentrun init`

Initializes AgentRun Ledger in the current Git repository.

Expected behavior:

- Create `.agentrun/`
- Create `.agentrun/agentrun.db`
- Create `.agentrun/reports/`
- Create DB schema if missing
- Add helpful message if already initialized
- Do not destroy existing data

Example:

```bash
agentrun init
```

Expected output:

```txt
AgentRun Ledger initialized.
Database: .agentrun/agentrun.db
```

---

### 2. `agentrun start "task name"`

Starts a new tracked session.

Expected behavior:

- Require repository to be initialized
- Create a new session row
- Store:
  - ID
  - title
  - started_at
  - status = active
  - initial git status
  - initial git diff
  - initial branch name
  - initial commit hash
- Set this as the active session

Example:

```bash
agentrun start "fix firebase save reset issue"
```

Expected output:

```txt
Started session #1: fix firebase save reset issue
```

---

### 3. `agentrun snapshot before|after`

Captures git state manually.

Expected behavior:

- Require active session
- Accept only `before` or `after`
- Store:
  - git status
  - git diff
  - git diff stat
  - timestamp
- If `before`, update before snapshot
- If `after`, update after snapshot

Example:

```bash
agentrun snapshot after
```

Expected output:

```txt
Captured after snapshot for session #1.
```

---

### 4. `agentrun run "command"`

Runs a shell command and logs the result.

Expected behavior:

- Require active session
- Execute the command in the current working directory
- Capture:
  - command string
  - exit code
  - stdout
  - stderr
  - started_at
  - ended_at
  - duration_ms
- Print live output if practical
- Store command result in SQLite
- Return the same exit code as the command

Example:

```bash
agentrun run "npm test"
```

Expected output:

```txt
Running: npm test
Command failed with exit code 1
Logged command result in session #1.
```

If successful:

```txt
Command passed.
Logged command result in session #1.
```

---

### 5. `agentrun note "text"`

Adds a human note to the active session.

Expected behavior:

- Require active session
- Store note text and timestamp

Example:

```bash
agentrun note "Codex changed auth retry logic and added tests."
```

---

### 6. `agentrun status`

Shows current active session and summary.

Expected output:

```txt
Active session #1: fix firebase save reset issue
Commands: 3 total, 2 passed, 1 failed
Files changed: 4
Last command: npm test — passed
```

---

### 7. `agentrun list`

Lists previous sessions.

Expected output:

```txt
#1 active   fix firebase save reset issue   2026-05-02 14:22
#2 closed   add checkout flow               2026-05-01 18:10
```

---

### 8. `agentrun report`

Generates a Markdown report for the active session.

Expected behavior:

- Capture an `after` snapshot automatically before generating
- Generate `.agentrun/reports/session-<id>.md`
- Include:
  - Title
  - Session metadata
  - Branch and commit info
  - Goal
  - Summary
  - Files changed
  - Command timeline
  - Failed commands
  - Passed commands
  - Git diff stat
  - Human notes
  - Review risks
  - Suggested follow-up
  - Final raw diff section, collapsible-style if possible in Markdown

Example:

```bash
agentrun report
```

Expected output:

```txt
Generated report: .agentrun/reports/session-1.md
```

---

### 9. `agentrun dashboard`

Starts a local dashboard server.

Expected behavior:

- Serve a lightweight React dashboard
- Default port: `3765`
- Allow custom port:

```bash
agentrun dashboard --port 4000
```

Dashboard should show:

- Session list
- Selected session details
- File changes
- Command timeline
- Report preview
- Notes
- Pass/fail badges

This dashboard can be simple but must be functional.

---

## Database Schema

Use SQLite. Create tables similar to the following.

### `sessions`

Fields:

- `id` integer primary key autoincrement
- `title` text not null
- `status` text not null default `active`
- `started_at` text not null
- `ended_at` text nullable
- `repo_path` text not null
- `branch_name` text nullable
- `start_commit` text nullable
- `active` integer not null default 1
- `initial_status` text nullable
- `initial_diff` text nullable
- `before_status` text nullable
- `before_diff` text nullable
- `before_diff_stat` text nullable
- `after_status` text nullable
- `after_diff` text nullable
- `after_diff_stat` text nullable

### `commands`

Fields:

- `id` integer primary key autoincrement
- `session_id` integer not null
- `command` text not null
- `exit_code` integer not null
- `stdout` text nullable
- `stderr` text nullable
- `started_at` text not null
- `ended_at` text not null
- `duration_ms` integer not null

### `notes`

Fields:

- `id` integer primary key autoincrement
- `session_id` integer not null
- `note` text not null
- `created_at` text not null

### `snapshots`

Fields:

- `id` integer primary key autoincrement
- `session_id` integer not null
- `kind` text not null
- `git_status` text nullable
- `git_diff` text nullable
- `git_diff_stat` text nullable
- `created_at` text not null

---

## Core Logic Requirements

### Git Utility

Create `git.ts` with functions:

- `isGitRepo(cwd: string): boolean`
- `getBranchName(cwd: string): string | null`
- `getCurrentCommit(cwd: string): string | null`
- `getGitStatus(cwd: string): string`
- `getGitDiff(cwd: string): string`
- `getGitDiffStat(cwd: string): string`
- `getChangedFilesFromDiffStat(diffStat: string): string[]`

Use `child_process` safely.

If not a Git repo, show a clear error:

```txt
AgentRun Ledger must be used inside a Git repository.
```

---

### Command Runner

Create `commandRunner.ts` with:

```ts
runLoggedCommand(command: string, cwd: string): Promise<CommandResult>
```

It must capture stdout/stderr and exit code.

Important:

- Do not crash the process just because the command fails
- Log failed commands with exit code
- CLI should eventually exit with the child command exit code

---

### Report Generator

Create `reportGenerator.ts`.

It should generate high-quality Markdown.

The report must include useful review heuristics even without AI.

Example heuristics:

- If any command failed, mention that failures occurred
- If no tests were run, warn that the session has no validation command
- If many files changed, warn that the review surface is large
- If package files changed, warn about dependency/config changes
- If `.env`, auth, payment, Firebase, database, migration, security, or config files changed, flag as sensitive areas
- If final diff is empty, explain that no tracked changes were found

---

## Review Heuristics

Create `reviewHeuristics.ts`.

Implement deterministic review warnings. Do not require LLM.

Inputs:

- changed files
- command results
- diff stat
- raw diff

Output:

```ts
type ReviewFinding = {
  severity: 'info' | 'warning' | 'danger';
  title: string;
  detail: string;
};
```

Required findings:

1. **No validation commands**
   - Trigger if no command includes `test`, `build`, `lint`, `typecheck`, `tsc`, `vitest`, `jest`, `npm run`, `pnpm`.

2. **Failed commands exist**
   - Trigger if any command exit code is not 0.

3. **Large change surface**
   - Trigger if changed files count >= 10.

4. **Dependency/config changes**
   - Trigger if files include `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `vite.config`, `tsconfig`, `.env`, `.github`.

5. **Sensitive logic changed**
   - Trigger if filenames or diff content mention auth, payment, firebase, database, migration, token, secret, credential, login, checkout, purchase, subscription.

6. **No tracked changes**
   - Trigger if changed files count is 0.

---

## Dashboard Requirements

The dashboard can be simple.

Minimum screens:

### Session List

Show:

- ID
- title
- status
- started date
- command count
- failed command count

### Session Detail

Show:

- title
- branch
- commit
- status
- changed files
- commands
- notes
- report preview

### Command Timeline

Each command should show:

- command text
- pass/fail
- exit code
- duration
- stdout/stderr expandable or truncated

### File Changes

Show changed files from diff stat.

### Report Preview

Generate report content on demand or show latest report.

---

## API Requirements

Create a small local server for dashboard.

Endpoints:

```txt
GET /api/sessions
GET /api/sessions/:id
GET /api/sessions/:id/report
POST /api/sessions/:id/report
```

The API can run inside the same dashboard command.

---

## README Requirements

Create a strong README with:

- Project name
- One-line description
- Problem statement
- Demo flow
- Installation
- CLI commands
- Dashboard screenshot placeholder
- Example report preview
- Why this exists
- Roadmap
- Development instructions
- Testing instructions

Do not make exaggerated claims.

Suggested headline:

```md
# AgentRun Ledger

Local session receipts for AI coding agents.
```

---

## Package Scripts

Add scripts like:

```json
{
  "scripts": {
    "dev": "tsx src/cli/index.ts",
    "build": "tsc",
    "test": "vitest run --reporter=default",
    "test:agent": "vitest run --reporter=dot",
    "lint": "eslint .",
    "dashboard": "vite --host 127.0.0.1"
  }
}
```

If ESLint setup slows the build, keep lint minimal or skip it. Tests and build are more important.

---

## Test Cases

Create real tests. Do not fake all tests with shallow checks.

Use temporary directories where needed.

### DB Tests

File: `tests/db.test.ts`

Test cases:

1. Initializes database and creates required tables
2. Running init twice does not delete existing session data
3. Can insert and read a session
4. Can insert and read commands for a session
5. Can insert and read notes for a session

---

### Git Tests

File: `tests/git.test.ts`

Use a temp directory and initialize Git.

Test cases:

1. Detects Git repository
2. Returns current branch
3. Captures status after file change
4. Captures diff after modifying a tracked file
5. Captures diff stat
6. Parses changed files from diff stat
7. Returns clear behavior outside Git repo

---

### Command Runner Tests

File: `tests/commandRunner.test.ts`

Test cases:

1. Captures successful command output
2. Captures failed command exit code
3. Captures stderr
4. Measures duration
5. Does not throw on non-zero exit code

Commands should be cross-platform where possible.

Use Node commands like:

```bash
node -e "console.log('hello')"
node -e "console.error('bad'); process.exit(2)"
```

---

### Session Service Tests

File: `tests/sessionService.test.ts`

Test cases:

1. Starts a new session
2. Marks new session as active
3. Deactivates previous active session when starting another
4. Captures before snapshot
5. Captures after snapshot
6. Adds note
7. Logs command result
8. Returns session summary with command counts and failed counts

---

### Review Heuristics Tests

File: `tests/reviewHeuristics.test.ts`

Test cases:

1. Warns when no validation command exists
2. Warns when failed commands exist
3. Warns when 10 or more files changed
4. Warns when package/config files changed
5. Warns when sensitive auth/payment/firebase/database text appears
6. Warns when no tracked files changed
7. Does not emit false danger when only harmless docs changed and tests passed

---

### Report Generator Tests

File: `tests/reportGenerator.test.ts`

Test cases:

1. Generates Markdown with title and metadata
2. Includes command timeline
3. Includes failed command section
4. Includes changed files
5. Includes notes
6. Includes review findings
7. Includes final diff section
8. Handles empty diff gracefully

---

### CLI Tests

File: `tests/cli.test.ts`

Test by spawning the CLI in temp Git repos.

Test cases:

1. `init` creates `.agentrun` directory and DB
2. `start` creates active session
3. `note` adds note
4. `run` logs successful command
5. `run` logs failed command and exits with child exit code
6. `snapshot after` stores snapshot
7. `report` creates Markdown file
8. `status` shows useful summary
9. Commands fail gracefully before init
10. Commands fail gracefully outside Git repo

---

## Manual QA Flow

After implementation, run this manual flow in a fresh test repository:

```bash
git init
npm init -y
printf "console.log('hello')\n" > index.js
git add .
git commit -m "initial commit"

agentrun init
agentrun start "demo agent session"
agentrun note "Testing AgentRun Ledger manually."
printf "console.log('hello agent')\n" > index.js
agentrun run "node index.js"
agentrun run "node -e \"console.error('intentional fail'); process.exit(2)\""
agentrun snapshot after
agentrun status
agentrun report
agentrun list
agentrun dashboard
```

Expected:

- DB exists
- Commands are logged
- Failed command is preserved
- Report file exists
- Report mentions failed command
- Report shows changed file `index.js`
- Dashboard opens and lists session

---

## Self-Correction Loop

You must follow this loop until the project is done:

### Step 1: Implement

Build the project feature by feature.

### Step 2: Run tests

Run:

```bash
npm test
```

If test output is too noisy, use:

```bash
npx vitest run --reporter=dot
```

### Step 3: Fix failures

For every failed test:

- Read the exact failure
- Identify whether the test or implementation is wrong
- Prefer fixing implementation unless the test is clearly invalid
- Do not delete meaningful tests to make the suite pass
- Do not replace real tests with fake snapshots

### Step 4: Run build

Run:

```bash
npm run build
```

Fix TypeScript errors.

### Step 5: Run CLI smoke test

Run a small manual smoke test in a temp Git repo.

At minimum verify:

```bash
agentrun init
agentrun start "smoke test"
agentrun note "hello"
agentrun run "node -e \"console.log('ok')\""
agentrun report
agentrun status
```

### Step 6: Re-run everything

Run again:

```bash
npm test
npm run build
```

### Step 7: Final verification

Before stopping, produce a final completion note in `BUILD_REPORT.md` containing:

- What was implemented
- Commands run
- Test results
- Build results
- Known limitations
- How to run the project
- Any features intentionally deferred

---

## Completion Criteria

The project is only considered done when all of the following are true:

- CLI works
- SQLite persistence works
- Git snapshots work
- Command logging works
- Markdown report generation works
- Dashboard starts
- Tests pass
- TypeScript build passes
- README exists and is useful
- `BUILD_REPORT.md` exists
- Manual smoke test has been performed or clearly documented

---

## Quality Bar

Code should be:

- Simple
- Typed
- Readable
- Modular
- Testable
- Useful on Windows, macOS, and Linux where reasonable

Use good error messages. Avoid silent failure.

---

## UX Tone

The CLI should feel like a calm developer tool.

Good:

```txt
No active AgentRun session found. Start one with: agentrun start "your task"
```

Bad:

```txt
Error: undefined session_id null reference
```

---

## Final Deliverable

When complete, the repository should be usable with:

```bash
npm install
npm run build
npm test
npm run dev -- init
npm run dev -- start "demo session"
npm run dev -- note "first note"
npm run dev -- run "node -e \"console.log('hello')\""
npm run dev -- report
npm run dev -- dashboard
```

Also include clear README instructions for global linking if supported:

```bash
npm link
agentrun init
```

---

## Important Instruction to Codex

Do not stop after creating files. Run the project. Test it. Fix it. Rerun it. Keep going until the completion criteria are met.

If something cannot be completed, document exactly what failed, why it failed, and what remains in `BUILD_REPORT.md`.
