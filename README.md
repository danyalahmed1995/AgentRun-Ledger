# AgentRun Ledger

Local session receipts for AI coding agents.

AgentRun Ledger is a local-first CLI and lightweight dashboard that records agent behavior, validation, and results: Git snapshots, touched files, commands, pass/fail outcomes, human notes, and a Markdown review report.

## Why This Exists

Long AI-assisted coding sessions can be hard to review after the fact. AgentRun Ledger gives the human reviewer a practical receipt: what the agent set out to do, what files changed, which validation commands ran, which commands failed, and what deterministic review risks deserve attention.

It is intentionally small. There are no accounts, cloud sync, browser recording, or paid API requirements.

## Demo Flow

```bash
npm install
npm run build
npm run dev -- init
npm run dev -- start "demo agent session"
npm run dev -- note "Testing AgentRun Ledger."
npm run dev -- run "node -e \"console.log('hello')\""
npm run dev -- report
npm run dev -- status
npm run dev -- dashboard
```

Open the dashboard at [http://127.0.0.1:3765](http://127.0.0.1:3765).

## Installation

For local development:

```bash
npm install
npm run build
```

For local linking:

```bash
npm link
agentrun init
```

On Windows PowerShell, if script execution blocks `npm`, use `npm.cmd`:

```bash
npm.cmd install
npm.cmd test
```

## CLI Commands

```bash
agentrun init
agentrun start "task name"
agentrun snapshot before
agentrun snapshot after
agentrun run "npm test"
agentrun note "Codex changed retry logic and added tests."
agentrun status
agentrun list
agentrun report
agentrun dashboard --port 3765
```

During development, replace `agentrun` with:

```bash
npm run dev -- <command>
```

## Dashboard

The dashboard shows:

- Session list with status and command counts
- Selected session metadata
- Changed files from the latest diff stat
- Command timeline with pass/fail badges and captured output
- Notes
- Report preview and report generation

Screenshot placeholder:

```txt
[Dashboard screenshot goes here]
```

## Example Report Preview

```md
# AgentRun Report: demo agent session

## Summary

- Changed files: 3
- Commands logged: 2
- Passed commands: 1
- Failed commands: 1

## Review risks

- **DANGER: Failed commands exist** - 1 logged command failed. Review the command timeline before merging.
```

## Development

```bash
npm run dev -- init
npm run dev -- start "work on feature"
npm run dev -- run "npm test"
npm run dev -- report
```

Useful scripts:

```bash
npm test
npm run test:agent
npm run build
npm run dashboard
```

## Testing

The test suite uses temporary Git repositories and exercises the DB layer, Git utilities, command runner, session service, report generator, review heuristics, and CLI.

```bash
npm test
```

## Notes And Limitations

- Persistence uses Node's built-in `node:sqlite`, so Node 24+ is recommended.
- Node currently prints an experimental warning for `node:sqlite`.
- Reports use deterministic heuristics only; no LLM or paid API is required.
- The command runner logs command output, but it is not a full terminal recorder.

## Roadmap

- Optional report summary provider behind an interface
- Better dashboard filtering and search
- Session close command
- Export report bundles
- Optional screenshot support for dashboard docs
