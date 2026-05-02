import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { initLedger, openLedgerDb } from '../src/core/db.js';
import { initGitRepo } from './helpers.js';

describe('database', () => {
  it('initializes database and creates required tables', () => {
    const cwd = initGitRepo();
    initLedger(cwd);
    expect(fs.existsSync(path.join(cwd, '.agentrun', 'agentrun.db'))).toBe(true);
    const db = openLedgerDb(cwd);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[];
    const commandColumns = db.prepare('PRAGMA table_info(commands)').all() as { name: string }[];
    db.close();
    expect(tables.map((table) => table.name)).toEqual(expect.arrayContaining(['sessions', 'commands', 'notes', 'snapshots']));
    expect(tables.map((table) => table.name)).not.toContain('ai_usage');
    expect(commandColumns.map((column) => column.name)).toEqual(expect.arrayContaining([
      'command_type',
      'attempt',
      'cwd',
      'environment_json',
      'output_summary_json',
      'failure_reason',
      'git_status_before',
      'git_status_after',
      'git_diff_stat'
    ]));
  });

  it('running init twice does not delete existing session data', () => {
    const cwd = initGitRepo();
    initLedger(cwd);
    const db = openLedgerDb(cwd);
    db.prepare("INSERT INTO sessions (title, started_at, repo_path) VALUES ('x', 'now', ?)").run(cwd);
    db.close();
    initLedger(cwd);
    const reopened = openLedgerDb(cwd);
    const count = reopened.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
    reopened.close();
    expect(count.count).toBe(1);
  });

  it('can insert and read a session', () => {
    const cwd = initGitRepo();
    initLedger(cwd);
    const db = openLedgerDb(cwd);
    db.prepare("INSERT INTO sessions (title, started_at, repo_path) VALUES ('task', 'now', ?)").run(cwd);
    const session = db.prepare('SELECT * FROM sessions WHERE title = ?').get('task') as { title: string };
    db.close();
    expect(session.title).toBe('task');
  });

  it('can insert and read commands for a session', () => {
    const cwd = initGitRepo();
    initLedger(cwd);
    const db = openLedgerDb(cwd);
    const session = db.prepare("INSERT INTO sessions (title, started_at, repo_path) VALUES ('task', 'now', ?)").run(cwd);
    db.prepare("INSERT INTO commands (session_id, command, exit_code, started_at, ended_at, duration_ms) VALUES (?, 'node -v', 0, 'a', 'b', 1)").run(Number(session.lastInsertRowid));
    const commands = db.prepare('SELECT * FROM commands WHERE session_id = ?').all(Number(session.lastInsertRowid));
    db.close();
    expect(commands).toHaveLength(1);
  });

  it('can insert and read notes for a session', () => {
    const cwd = initGitRepo();
    initLedger(cwd);
    const db = openLedgerDb(cwd);
    const session = db.prepare("INSERT INTO sessions (title, started_at, repo_path) VALUES ('task', 'now', ?)").run(cwd);
    db.prepare("INSERT INTO notes (session_id, note, created_at) VALUES (?, 'hello', 'now')").run(Number(session.lastInsertRowid));
    const note = db.prepare('SELECT * FROM notes WHERE session_id = ?').get(Number(session.lastInsertRowid)) as { note: string };
    db.close();
    expect(note.note).toBe('hello');
  });
});
