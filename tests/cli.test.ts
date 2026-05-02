import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cli, initGitRepo, tempDir } from './helpers.js';

describe('cli', () => {
  it('init creates .agentrun directory and DB', () => {
    const cwd = initGitRepo();
    const result = cli(cwd, ['init']);
    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(cwd, '.agentrun', 'agentrun.db'))).toBe(true);
  });

  it('start creates active session', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    const result = cli(cwd, ['start', 'task']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Started session #1');
  });

  it('note adds note', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    cli(cwd, ['start', 'task']);
    const result = cli(cwd, ['note', 'hello']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Added note');
  });

  it('usage command is not available', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    cli(cwd, ['start', 'task']);
    const result = cli(cwd, ['usage']);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('unknown command');
  });

  it('run logs successful command', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    cli(cwd, ['start', 'task']);
    const result = cli(cwd, ['run', 'node -e "console.log(\'ok\')"']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Command passed');
  });

  it('run logs failed command and exits with child exit code', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    cli(cwd, ['start', 'task']);
    const result = cli(cwd, ['run', 'node -e "process.exit(2)"']);
    expect(result.status).toBe(2);
    expect(result.stdout).toContain('Command failed with exit code 2');
  });

  it('snapshot after stores snapshot and report creates Markdown file', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    cli(cwd, ['start', 'task']);
    fs.writeFileSync(path.join(cwd, 'index.js'), "console.log('changed')\n");
    expect(cli(cwd, ['snapshot', 'after']).stdout).toContain('Captured after snapshot');
    const report = cli(cwd, ['report']);
    expect(report.status).toBe(0);
    expect(fs.existsSync(path.join(cwd, '.agentrun', 'reports', 'session-1.md'))).toBe(true);
  });

  it('status shows useful summary', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    cli(cwd, ['start', 'task']);
    const result = cli(cwd, ['status']);
    expect(result.stdout).toContain('Active session #1');
    expect(result.stdout).toContain('Commands:');
  });

  it('close completes active session and creates report', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    cli(cwd, ['start', 'task']);
    const result = cli(cwd, ['close']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Closed session #1');
    const reportPath = path.join(cwd, '.agentrun', 'reports', 'session-1.md');
    expect(fs.existsSync(reportPath)).toBe(true);
    const report = fs.readFileSync(reportPath, 'utf8');
    expect(report).toContain('- Status: completed');
    expect(report).toContain('- Duration:');

    const status = cli(cwd, ['status']);
    expect(status.status).toBe(0);
    expect(status.stdout).toContain('Completed session #1');
    expect(status.stdout).toContain('Ended:');
    expect(status.stdout).toContain('Duration:');
  });

  it('close fails when no active session exists', () => {
    const cwd = initGitRepo();
    cli(cwd, ['init']);
    const result = cli(cwd, ['close']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('No active session to close');
  });

  it('commands fail gracefully before init', () => {
    const cwd = initGitRepo();
    const result = cli(cwd, ['start', 'task']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('not initialized');
  });

  it('commands fail gracefully outside Git repo', () => {
    const cwd = tempDir('agentrun-no-git-');
    const result = cli(cwd, ['init']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('must be used inside a Git repository');
  });
});
