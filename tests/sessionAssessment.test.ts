import { describe, expect, it } from 'vitest';
import { assessSession } from '../src/core/sessionAssessment.js';
import type { SessionDetail } from '../src/core/types.js';

function detail(overrides: Partial<SessionDetail> = {}): SessionDetail {
  return {
    id: 1,
    title: 'assessment',
    status: 'active',
    started_at: new Date().toISOString(),
    ended_at: null,
    repo_path: '/repo',
    branch_name: 'main',
    start_commit: 'abc',
    active: 1,
    initial_status: '',
    initial_diff: '',
    before_status: '',
    before_diff: '',
    before_diff_stat: '',
    after_status: '',
    after_diff: '',
    after_diff_stat: '',
    commands: [],
    notes: [],
    snapshots: [],
    ...overrides
  };
}

const command = (overrides = {}) => ({
  id: 1,
  session_id: 1,
  command: 'npm test',
  exit_code: 0,
  stdout: '',
  stderr: '',
  started_at: new Date().toISOString(),
  ended_at: new Date().toISOString(),
  duration_ms: 1,
  command_type: 'test' as const,
  attempt: 1,
  cwd: '/repo',
  environment_json: null,
  output_summary_json: null,
  failure_reason: null,
  git_status_before: null,
  git_status_after: null,
  git_diff_stat: null,
  ...overrides
});

describe('session assessment', () => {
  it('marks sessions without validation as unverified', () => {
    const assessment = assessSession(detail());
    expect(assessment.verdict).toBe('UNVERIFIED');
    expect(assessment.score).toBe(7);
  });

  it('marks validated sessions as ready', () => {
    const assessment = assessSession(detail({
      commands: [command()]
    }));
    expect(assessment.verdict).toBe('READY');
    expect(assessment.score).toBe(10);
  });

  it('computes unstable verdict and score penalties', () => {
    const assessment = assessSession(detail({
      commands: [
        command({ command: 'node bad', command_type: 'custom', exit_code: 1, attempt: 1 }),
        command({ id: 2, command: 'node bad', command_type: 'custom', exit_code: 1, attempt: 2 })
      ]
    }));
    expect(assessment.verdict).toBe('UNSTABLE');
    expect(assessment.score).toBe(2);
    expect(assessment.scoreBreakdown).toEqual(expect.arrayContaining(['No validation (-3)', 'Failed commands (-3)', 'Retries still failing (-2)']));
  });
});
