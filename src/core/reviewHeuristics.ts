import type { CommandRecord, ReviewFinding } from './types.js';

const validationPattern = /\b(test|build|lint|typecheck|tsc|vitest|jest)\b|npm run|pnpm/i;
const configFiles = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'vite.config',
  'tsconfig',
  '.env',
  '.github'
];
const sensitivePattern = /auth|payment|firebase|database|migration|token|secret|credential|login|checkout|purchase|subscription/i;

export function generateReviewFindings(input: {
  changedFiles: string[];
  commands: Pick<CommandRecord, 'command' | 'exit_code'>[];
  diffStat?: string | null;
  rawDiff?: string | null;
}): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const { changedFiles, commands, rawDiff = '' } = input;

  if (!commands.some((command) => validationPattern.test(command.command))) {
    findings.push({
      severity: 'warning',
      title: 'No validation commands',
      detail: 'No test, build, lint, typecheck, or package validation command was logged for this session.'
    });
  }

  const failed = commands.filter((command) => command.exit_code !== 0);
  if (failed.length > 0) {
    findings.push({
      severity: 'danger',
      title: 'Failed commands exist',
      detail: `${failed.length} logged command${failed.length === 1 ? '' : 's'} failed. Review the command timeline before merging.`
    });
  }

  if (changedFiles.length >= 10) {
    findings.push({
      severity: 'warning',
      title: 'Large change surface',
      detail: `${changedFiles.length} files changed. Consider reviewing by subsystem and checking for unrelated edits.`
    });
  }

  if (changedFiles.some((file) => configFiles.some((needle) => file.includes(needle)))) {
    findings.push({
      severity: 'warning',
      title: 'Dependency/config changes',
      detail: 'Package, lockfile, TypeScript, Vite, environment, or GitHub config files changed.'
    });
  }

  const sensitiveHaystack = `${changedFiles.join('\n')}\n${rawDiff ?? ''}`;
  if (sensitivePattern.test(sensitiveHaystack)) {
    findings.push({
      severity: 'danger',
      title: 'Sensitive logic changed',
      detail: 'The changed files or diff mention auth, payment, Firebase, database, credentials, or similar sensitive areas.'
    });
  }

  if (changedFiles.length === 0) {
    findings.push({
      severity: 'info',
      title: 'No tracked changes',
      detail: 'No tracked file changes were found in the final snapshot.'
    });
  }

  return findings;
}
