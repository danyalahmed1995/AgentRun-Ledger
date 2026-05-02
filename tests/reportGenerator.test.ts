import { describe, expect, it } from 'vitest';
import { generateReportMarkdown } from '../src/core/reportGenerator.js';
import type { SessionDetail } from '../src/core/types.js';

function detail(overrides: Partial<SessionDetail> = {}): SessionDetail {
  return {
    id: 1,
    title: 'demo session',
    status: 'active',
    started_at: new Date('2026-05-02T10:00:00Z').toISOString(),
    ended_at: null,
    repo_path: '/repo',
    branch_name: 'main',
    start_commit: 'abc123',
    active: 1,
    initial_status: '',
    initial_diff: '',
    before_status: '',
    before_diff: '',
    before_diff_stat: '',
    after_status: ' M index.js',
    after_diff: "diff --git a/index.js b/index.js\n+console.log('hello')",
    after_diff_stat: 'M\tindex.js',
    commands: [
      {
        id: 1,
        session_id: 1,
        command: 'npm test',
        exit_code: 0,
        stdout: 'ok',
        stderr: '',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_ms: 10,
        command_type: 'test',
        attempt: 1,
        cwd: '/repo',
        environment_json: JSON.stringify({ node: 'v24.0.0', platform: 'win32', arch: 'x64', branch: 'main', commit: 'abc123' }),
        output_summary_json: JSON.stringify({ keywords: [], passed_tests: 1, failed_tests: 0, has_errors: false, has_warnings: false }),
        failure_reason: null,
        git_status_before: '',
        git_status_after: '',
        git_diff_stat: 'M\tindex.js'
      },
      {
        id: 2,
        session_id: 1,
        command: 'node bad',
        exit_code: 2,
        stdout: '',
        stderr: 'bad',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_ms: 5,
        command_type: 'custom',
        attempt: 1,
        cwd: '/repo',
        environment_json: JSON.stringify({ node: 'v24.0.0', platform: 'win32', arch: 'x64', branch: 'main', commit: 'abc123' }),
        output_summary_json: JSON.stringify({ keywords: ['error'], passed_tests: null, failed_tests: null, has_errors: true, has_warnings: false }),
        failure_reason: 'runtime_error',
        git_status_before: '',
        git_status_after: '',
        git_diff_stat: 'M\tindex.js'
      }
    ],
    notes: [{ id: 1, session_id: 1, note: 'human note', created_at: new Date().toISOString() }],
    snapshots: [],
    ...overrides
  };
}

describe('report generator', () => {
  it('generates Markdown with title and metadata', () => {
    const markdown = generateReportMarkdown(detail());
    expect(markdown).toContain('# AgentRun Report: demo session');
    expect(markdown).toContain('Final Verdict: ❌ UNSTABLE');
    expect(markdown).toContain('Session Score:');
    expect(markdown).toContain('## Top summary');
    expect(markdown).toContain('- Commands: 2');
    expect(markdown).toContain('- Failed commands: 1');
    expect(markdown).toContain('- Retries: 0');
    expect(markdown).toContain('- Validation status: performed');
    expect(markdown).toContain('## Session metadata');
  });

  it('includes command timeline and failed command section', () => {
    const markdown = generateReportMarkdown(detail());
    expect(markdown).toContain('## Command timeline');
    expect(markdown).toContain('## Failed commands');
    expect(markdown).toContain('Type: test');
    expect(markdown).toContain('Failure reason: runtime_error');
    expect(markdown).toContain('Output summary:');
    expect(markdown).toContain('node bad');
  });

  it('includes changed files, notes, review findings, and final diff', () => {
    const markdown = generateReportMarkdown(detail());
    expect(markdown).toContain('🟢 index.js (modified)');
    expect(markdown).toContain('human note');
    expect(markdown).toContain('Failed commands exist');
    expect(markdown).toContain('## Final raw diff');
    expect(markdown).not.toContain('AI Usage');
    expect(markdown).not.toContain('tokens');
    expect(markdown).not.toContain('Cost:');
  });

  it('shows unverified summary without validation', () => {
    const markdown = generateReportMarkdown(detail({
      commands: []
    }));
    expect(markdown).toContain('Final Verdict: ⚠️ UNVERIFIED');
    expect(markdown).toContain('- Validation status: not performed');
    expect(markdown).not.toContain('AI Efficiency');
  });

  it('handles empty diff gracefully', () => {
    const markdown = generateReportMarkdown(detail({ after_status: '', after_diff: '', after_diff_stat: '', commands: [] }));
    expect(markdown).toContain('No tracked changes were found');
    expect(markdown).toContain('No file changes detected');
    expect(markdown).toContain('No tracked diff available.');
  });

  it('includes added deleted and renamed file statuses', () => {
    const markdown = generateReportMarkdown(detail({
      after_status: '?? untracked.ts',
      after_diff_stat: 'A\tnew-file.ts\nD\told-file.js\nR100\tsrc/old.ts\tsrc/new.ts'
    }));
    expect(markdown).toContain('🟡 new-file.ts (added)');
    expect(markdown).toContain('🔴 old-file.js (deleted)');
    expect(markdown).toContain('🔵 src/old.ts -> src/new.ts (renamed)');
    expect(markdown).toContain('🟡 untracked.ts (added)');
  });
});
