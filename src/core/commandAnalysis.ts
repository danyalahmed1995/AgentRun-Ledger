import { getBranchName, getCurrentCommit } from './git.js';
import type { CommandType, EnvironmentSnapshot, FailureReason, OutputSummary } from './types.js';

const errorKeywords = ['error', 'failed', 'exception', 'cannot find', 'syntaxerror'];

export function detectCommandType(command: string): CommandType {
  const normalized = command.toLowerCase();
  if (/\b(npm\s+test|vitest|jest)\b/.test(normalized)) return 'test';
  if (/\b(npm\s+run\s+build|vite\s+build)\b/.test(normalized)) return 'build';
  if (/\b(eslint|lint)\b/.test(normalized)) return 'lint';
  if (/\btsc\b/.test(normalized)) return 'typecheck';
  if (/\b(npm\s+install|npm\s+i)\b/.test(normalized)) return 'install';
  return 'custom';
}

export function createEnvironmentSnapshot(cwd: string): EnvironmentSnapshot {
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    branch: getBranchName(cwd),
    commit: getCurrentCommit(cwd)
  };
}

export function summarizeOutput(stdout = '', stderr = ''): OutputSummary {
  const combined = `${stdout}\n${stderr}`;
  const lower = combined.toLowerCase();
  const keywords = errorKeywords.filter((keyword) => lower.includes(keyword));
  return {
    keywords,
    passed_tests: extractTestCount(combined, ['passed', 'pass']),
    failed_tests: extractTestCount(combined, ['failed', 'fail']),
    has_errors: keywords.length > 0 || /\berrors?\b/i.test(combined),
    has_warnings: /\bwarnings?\b/i.test(combined)
  };
}

export function inferFailureReason(input: {
  exitCode: number;
  commandType: CommandType;
  outputSummary: OutputSummary;
  stdout?: string | null;
  stderr?: string | null;
}): FailureReason | null {
  if (input.exitCode === 0) return null;
  if (input.commandType === 'test') return 'test_failure';
  if (input.commandType === 'build') return 'build_failure';
  if (input.commandType === 'lint') return 'lint_failure';
  if (input.commandType === 'typecheck') return 'typecheck_failure';
  if (input.commandType === 'install') return 'dependency_failure';

  const output = `${input.stdout ?? ''}\n${input.stderr ?? ''}`;
  if (!output.trim()) return 'runtime_exit_failure';
  if (input.outputSummary.has_errors || /syntaxerror|exception|cannot find|module not found|referenceerror|typeerror/i.test(output)) {
    return 'runtime_error';
  }

  return 'unknown_failure';
}

function extractTestCount(output: string, words: string[]): number | null {
  const alternatives = words.join('|');
  const patterns = [
    new RegExp(`(\\d+)\\s+(?:tests?\\s+)?(?:${alternatives})`, 'i'),
    new RegExp(`(?:${alternatives})\\s*:?\\s*(\\d+)`, 'i')
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }

  return null;
}
