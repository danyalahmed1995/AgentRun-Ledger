import { initLedger, openLedgerDb } from './db.js';
import { detectCommandType, inferFailureReason, summarizeOutput } from './commandAnalysis.js';
import { parseFileChanges } from './fileChanges.js';
import { assertGitRepo, getBranchName, getCurrentCommit, getGitDiff, getGitDiffStat, getGitStatus } from './git.js';
import type { CommandRecord, CommandResult, Note, Session, SessionDetail, SessionSummary, Snapshot, SnapshotKind } from './types.js';

export function initialize(cwd: string): string {
  assertGitRepo(cwd);
  return initLedger(cwd);
}

export function startSession(cwd: string, title: string): Session {
  assertGitRepo(cwd);
  const db = openLedgerDb(cwd);
  try {
    db.exec('UPDATE sessions SET active = 0, status = CASE WHEN status = \'active\' THEN \'closed\' ELSE status END, ended_at = COALESCE(ended_at, datetime(\'now\')) WHERE active = 1');
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO sessions (title, status, started_at, repo_path, branch_name, start_commit, active, initial_status, initial_diff)
      VALUES (?, 'active', ?, ?, ?, ?, 1, ?, ?)
    `).run(title, now, cwd, getBranchName(cwd), getCurrentCommit(cwd), getGitStatus(cwd), getGitDiff(cwd));
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(Number(result.lastInsertRowid)) as Session;
  } finally {
    db.close();
  }
}

export function getActiveSession(cwd: string): Session | null {
  const db = openLedgerDb(cwd);
  try {
    return (db.prepare('SELECT * FROM sessions WHERE active = 1 ORDER BY id DESC LIMIT 1').get() as Session | undefined) ?? null;
  } finally {
    db.close();
  }
}

export function getSessionById(cwd: string, id: number): Session | null {
  const db = openLedgerDb(cwd);
  try {
    return (db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined) ?? null;
  } finally {
    db.close();
  }
}

export function requireActiveSession(cwd: string): Session {
  const session = getActiveSession(cwd);
  if (!session) {
    throw new Error('No active AgentRun session found. Start one with: agentrun start "your task"');
  }
  return session;
}

export function closeActiveSession(cwd: string): Session {
  const active = getActiveSession(cwd);
  if (!active) throw new Error('No active session to close');
  if (active.status === 'completed') throw new Error(`Session #${active.id} is already completed.`);

  const db = openLedgerDb(cwd);
  try {
    const endedAt = new Date().toISOString();
    db.prepare('UPDATE sessions SET status = ?, active = 0, ended_at = ? WHERE id = ?').run('completed', endedAt, active.id);
  } finally {
    db.close();
  }

  const session = getSessionById(cwd, active.id);
  if (!session) throw new Error(`Session #${active.id} not found after close.`);
  return session;
}

export function captureSnapshot(cwd: string, kind: SnapshotKind, sessionId = requireActiveSession(cwd).id): Snapshot {
  assertGitRepo(cwd);
  const gitStatus = getGitStatus(cwd);
  const gitDiff = getGitDiff(cwd);
  const gitDiffStat = getGitDiffStat(cwd);
  const now = new Date().toISOString();
  const db = openLedgerDb(cwd);
  try {
    const result = db.prepare(`
      INSERT INTO snapshots (session_id, kind, git_status, git_diff, git_diff_stat, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, kind, gitStatus, gitDiff, gitDiffStat, now);
    const prefix = kind === 'before' ? 'before' : 'after';
    db.prepare(`
      UPDATE sessions SET
        ${prefix}_status = ?,
        ${prefix}_diff = ?,
        ${prefix}_diff_stat = ?
      WHERE id = ?
    `).run(gitStatus, gitDiff, gitDiffStat, sessionId);
    return db.prepare('SELECT * FROM snapshots WHERE id = ?').get(Number(result.lastInsertRowid)) as Snapshot;
  } finally {
    db.close();
  }
}

export function addNote(cwd: string, note: string, sessionId = requireActiveSession(cwd).id): Note {
  const db = openLedgerDb(cwd);
  try {
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO notes (session_id, note, created_at) VALUES (?, ?, ?)').run(sessionId, note, now);
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(Number(result.lastInsertRowid)) as Note;
  } finally {
    db.close();
  }
}

export function logCommandResult(cwd: string, result: CommandResult, sessionId = requireActiveSession(cwd).id): CommandRecord {
  const db = openLedgerDb(cwd);
  try {
    const commandType = result.command_type ?? detectCommandType(result.command);
    const outputSummary = result.output_summary_json ?? JSON.stringify(summarizeOutput(result.stdout ?? '', result.stderr ?? ''));
    const attempt = result.attempt ?? nextAttempt(db, sessionId, result.command);
    const failureReason = result.failure_reason ?? inferFailureReason({
      exitCode: result.exit_code,
      commandType,
      outputSummary: JSON.parse(outputSummary) as ReturnType<typeof summarizeOutput>,
      stdout: result.stdout,
      stderr: result.stderr
    });
    const insert = db.prepare(`
      INSERT INTO commands (
        session_id,
        command,
        exit_code,
        stdout,
        stderr,
        started_at,
        ended_at,
        duration_ms,
        command_type,
        attempt,
        cwd,
        environment_json,
        output_summary_json,
        failure_reason,
        git_status_before,
        git_status_after,
        git_diff_stat
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      result.command,
      result.exit_code,
      result.stdout,
      result.stderr,
      result.started_at,
      result.ended_at,
      result.duration_ms,
      commandType,
      attempt,
      result.cwd ?? cwd,
      result.environment_json ?? null,
      outputSummary,
      failureReason,
      result.git_status_before ?? null,
      result.git_status_after ?? null,
      result.git_diff_stat ?? null
    );
    return db.prepare('SELECT * FROM commands WHERE id = ?').get(Number(insert.lastInsertRowid)) as CommandRecord;
  } finally {
    db.close();
  }
}

function nextAttempt(db: ReturnType<typeof openLedgerDb>, sessionId: number, command: string): number {
  const row = db.prepare('SELECT COALESCE(MAX(attempt), 0) + 1 as attempt FROM commands WHERE session_id = ? AND command = ?').get(sessionId, command) as { attempt: number };
  return row.attempt;
}

export function listSessions(cwd: string): SessionSummary[] {
  const db = openLedgerDb(cwd);
  try {
    const sessions = db.prepare('SELECT * FROM sessions ORDER BY id DESC').all() as Session[];
    return sessions.map((session) => buildSummary(db, session));
  } finally {
    db.close();
  }
}

export function getSessionDetail(cwd: string, id: number): SessionDetail | null {
  const db = openLedgerDb(cwd);
  try {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined;
    if (!session) return null;
    const commands = db.prepare('SELECT * FROM commands WHERE session_id = ? ORDER BY id ASC').all(id) as CommandRecord[];
    const notes = db.prepare('SELECT * FROM notes WHERE session_id = ? ORDER BY id ASC').all(id) as Note[];
    const snapshots = db.prepare('SELECT * FROM snapshots WHERE session_id = ? ORDER BY id ASC').all(id) as Snapshot[];
    return { ...session, commands, notes, snapshots };
  } finally {
    db.close();
  }
}

export function getActiveSessionDetail(cwd: string): SessionDetail {
  const active = requireActiveSession(cwd);
  return getSessionDetail(cwd, active.id)!;
}

export function getSessionSummary(cwd: string, sessionId = requireActiveSession(cwd).id): SessionSummary {
  const db = openLedgerDb(cwd);
  try {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Session | undefined;
    if (!session) throw new Error(`Session #${sessionId} not found.`);
    return buildSummary(db, session);
  } finally {
    db.close();
  }
}

export function getCurrentOrLatestSessionSummary(cwd: string): SessionSummary {
  const db = openLedgerDb(cwd);
  try {
    const session = db.prepare('SELECT * FROM sessions ORDER BY active DESC, id DESC LIMIT 1').get() as Session | undefined;
    if (!session) throw new Error('No AgentRun sessions found.');
    return buildSummary(db, session);
  } finally {
    db.close();
  }
}

function buildSummary(db: ReturnType<typeof openLedgerDb>, session: Session): SessionSummary {
  const commands = db.prepare('SELECT * FROM commands WHERE session_id = ? ORDER BY id ASC').all(session.id) as CommandRecord[];
  const diffStat = session.after_diff_stat ?? session.before_diff_stat ?? '';
  const changedFiles = parseFileChanges(diffStat, session.after_status ?? session.before_status ?? '');
  return {
    session,
    commandCount: commands.length,
    passedCount: commands.filter((command) => command.exit_code === 0).length,
    failedCount: commands.filter((command) => command.exit_code !== 0).length,
    filesChanged: changedFiles.length,
    lastCommand: commands.at(-1) ?? null
  };
}
