import { describe, expect, it } from 'vitest';
import { detectCommandType, inferFailureReason, summarizeOutput } from '../src/core/commandAnalysis.js';

describe('command analysis', () => {
  it('detects command types', () => {
    expect(detectCommandType('npm test')).toBe('test');
    expect(detectCommandType('npm run build')).toBe('build');
    expect(detectCommandType('eslint .')).toBe('lint');
    expect(detectCommandType('tsc --noEmit')).toBe('typecheck');
    expect(detectCommandType('npm install')).toBe('install');
    expect(detectCommandType('node index.js')).toBe('custom');
  });

  it('summarizes output without an LLM', () => {
    const summary = summarizeOutput('Tests 2 passed, 1 failed', 'SyntaxError: bad');
    expect(summary.has_errors).toBe(true);
    expect(summary.passed_tests).toBe(2);
    expect(summary.failed_tests).toBe(1);
    expect(summary.keywords).toContain('syntaxerror');
  });

  it('infers failure reasons', () => {
    const summary = summarizeOutput('', 'error');
    expect(inferFailureReason({ exitCode: 1, commandType: 'test', outputSummary: summary })).toBe('test_failure');
    expect(inferFailureReason({ exitCode: 1, commandType: 'build', outputSummary: summary })).toBe('build_failure');
    expect(inferFailureReason({ exitCode: 1, commandType: 'lint', outputSummary: summary })).toBe('lint_failure');
    expect(inferFailureReason({ exitCode: 1, commandType: 'typecheck', outputSummary: summary })).toBe('typecheck_failure');
    expect(inferFailureReason({ exitCode: 1, commandType: 'install', outputSummary: summary })).toBe('dependency_failure');
    expect(inferFailureReason({ exitCode: 1, commandType: 'custom', outputSummary: summary, stderr: 'error' })).toBe('runtime_error');
    expect(inferFailureReason({ exitCode: 1, commandType: 'custom', outputSummary: summarizeOutput('', ''), stdout: '', stderr: '' })).toBe('runtime_exit_failure');
  });
});
