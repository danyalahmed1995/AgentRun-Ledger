import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { initialize, addNote, captureSnapshot, closeActiveSession, getActiveSession, getCurrentOrLatestSessionSummary, getSessionSummary, logCommandResult, startSession } from '../src/core/sessionService.js';
import { initGitRepo } from './helpers.js';

describe('session service', () => {
  it('starts a new session and marks it active', () => {
    const cwd = initGitRepo();
    initialize(cwd);
    const session = startSession(cwd, 'task');
    expect(session.title).toBe('task');
    expect(getActiveSession(cwd)?.id).toBe(session.id);
  });

  it('deactivates previous active session when starting another', () => {
    const cwd = initGitRepo();
    initialize(cwd);
    const first = startSession(cwd, 'first');
    const second = startSession(cwd, 'second');
    expect(getActiveSession(cwd)?.id).toBe(second.id);
    expect(getSessionSummary(cwd, first.id).session.active).toBe(0);
  });

  it('closes active session with completed status and ended_at', () => {
    const cwd = initGitRepo();
    initialize(cwd);
    const session = startSession(cwd, 'task');
    const closed = closeActiveSession(cwd);
    expect(closed.id).toBe(session.id);
    expect(closed.status).toBe('completed');
    expect(closed.active).toBe(0);
    expect(closed.ended_at).toBeTruthy();
    expect(getActiveSession(cwd)).toBeNull();
    expect(getCurrentOrLatestSessionSummary(cwd).session.id).toBe(session.id);
  });

  it('fails when closing without an active session', () => {
    const cwd = initGitRepo();
    initialize(cwd);
    expect(() => closeActiveSession(cwd)).toThrow('No active session to close');
  });

  it('captures before and after snapshots', () => {
    const cwd = initGitRepo();
    initialize(cwd);
    const session = startSession(cwd, 'task');
    fs.writeFileSync(path.join(cwd, 'index.js'), "console.log('changed')\n");
    expect(captureSnapshot(cwd, 'before', session.id).kind).toBe('before');
    expect(captureSnapshot(cwd, 'after', session.id).git_diff).toContain('changed');
  });

  it('adds note', () => {
    const cwd = initGitRepo();
    initialize(cwd);
    const session = startSession(cwd, 'task');
    expect(addNote(cwd, 'hello', session.id).note).toBe('hello');
  });

  it('logs command result and returns summary counts', () => {
    const cwd = initGitRepo();
    initialize(cwd);
    const session = startSession(cwd, 'task');
    logCommandResult(cwd, {
      command: 'node -v',
      exit_code: 0,
      stdout: 'v',
      stderr: '',
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_ms: 1
    }, session.id);
    logCommandResult(cwd, {
      command: 'node bad',
      exit_code: 1,
      stdout: '',
      stderr: 'bad',
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_ms: 1
    }, session.id);
    const summary = getSessionSummary(cwd, session.id);
    expect(summary.commandCount).toBe(2);
    expect(summary.failedCount).toBe(1);
  });

  it('increments attempt for repeated commands and stores enriched fields', () => {
    const cwd = initGitRepo();
    initialize(cwd);
    const session = startSession(cwd, 'task');
    const now = new Date().toISOString();
    const first = logCommandResult(cwd, {
      command: 'npm test',
      exit_code: 1,
      stdout: '1 failed',
      stderr: 'Error',
      started_at: now,
      ended_at: now,
      duration_ms: 1
    }, session.id);
    const second = logCommandResult(cwd, {
      command: 'npm test',
      exit_code: 0,
      stdout: '1 passed',
      stderr: '',
      started_at: now,
      ended_at: now,
      duration_ms: 1
    }, session.id);
    expect(first.command_type).toBe('test');
    expect(first.attempt).toBe(1);
    expect(first.failure_reason).toBe('test_failure');
    expect(second.attempt).toBe(2);
    expect(second.output_summary_json).toContain('passed_tests');
  });
});
