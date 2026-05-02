import { describe, expect, it } from 'vitest';
import { generateReviewFindings } from '../src/core/reviewHeuristics.js';

const command = (text: string, exit = 0) => ({ command: text, exit_code: exit });

describe('review heuristics', () => {
  it('warns when no validation command exists', () => {
    expect(generateReviewFindings({ changedFiles: ['a.ts'], commands: [command('echo hi')] }).map((f) => f.title)).toContain('No validation commands');
  });

  it('warns when failed commands exist', () => {
    expect(generateReviewFindings({ changedFiles: ['a.ts'], commands: [command('npm test', 1)] }).map((f) => f.title)).toContain('Failed commands exist');
  });

  it('warns when 10 or more files changed', () => {
    const files = Array.from({ length: 10 }, (_, i) => `${i}.ts`);
    expect(generateReviewFindings({ changedFiles: files, commands: [command('npm test')] }).map((f) => f.title)).toContain('Large change surface');
  });

  it('warns when package/config files changed', () => {
    expect(generateReviewFindings({ changedFiles: ['package.json'], commands: [command('npm test')] }).map((f) => f.title)).toContain('Dependency/config changes');
  });

  it('warns when sensitive text appears', () => {
    expect(generateReviewFindings({ changedFiles: ['src/auth.ts'], commands: [command('npm test')] }).map((f) => f.title)).toContain('Sensitive logic changed');
  });

  it('warns when no tracked files changed', () => {
    expect(generateReviewFindings({ changedFiles: [], commands: [command('npm test')] }).map((f) => f.title)).toContain('No tracked changes');
  });

  it('does not emit false danger when only harmless docs changed and tests passed', () => {
    const findings = generateReviewFindings({ changedFiles: ['README.md'], commands: [command('npm test')] });
    expect(findings.some((finding) => finding.severity === 'danger')).toBe(false);
  });
});
