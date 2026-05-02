import type { CommandRecord, SessionAssessment, SessionDetail, SessionVerdict } from './types.js';

const validationTypes = new Set(['test', 'build', 'lint', 'typecheck']);

export function hasValidationCommand(commands: Pick<CommandRecord, 'command_type'>[]): boolean {
  return commands.some((command) => command.command_type ? validationTypes.has(command.command_type) : false);
}

export function assessSession(detail: SessionDetail): SessionAssessment {
  const failedCommands = detail.commands.filter((command) => command.exit_code !== 0).length;
  const hasValidation = hasValidationCommand(detail.commands);
  const unresolvedRetryFailures = countUnresolvedRetryFailures(detail.commands);

  const verdictReasons: string[] = [];
  let verdict: SessionVerdict = 'READY';
  if (failedCommands > 0) {
    verdict = 'UNSTABLE';
    verdictReasons.push('Failed commands exist');
  }
  if (!hasValidation) {
    if (verdict !== 'UNSTABLE') verdict = 'UNVERIFIED';
    verdictReasons.push('No validation performed');
  }
  if (verdictReasons.length === 0) verdictReasons.push('Validation commands passed without logged failures');

  const scoreBreakdown: string[] = [];
  let score = 10;
  if (!hasValidation) {
    score -= 3;
    scoreBreakdown.push('No validation (-3)');
  }
  if (failedCommands > 0) {
    score -= 3;
    scoreBreakdown.push('Failed commands (-3)');
  }
  if (unresolvedRetryFailures > 0) {
    score -= 2;
    scoreBreakdown.push('Retries still failing (-2)');
  }
  if (scoreBreakdown.length === 0) scoreBreakdown.push('No score penalties');

  return {
    verdict,
    verdictIcon: verdictIcon(verdict),
    verdictReason: verdictReasons,
    score: Math.max(0, score),
    scoreBreakdown,
    hasValidation,
    failedCommands,
    unresolvedRetryFailures
  };
}

export function countUnresolvedRetryFailures(commands: CommandRecord[]): number {
  const byCommand = new Map<string, CommandRecord[]>();
  for (const command of commands) {
    byCommand.set(command.command, [...(byCommand.get(command.command) ?? []), command]);
  }

  let count = 0;
  for (const attempts of byCommand.values()) {
    if (attempts.length > 1 && attempts.some((attempt) => attempt.exit_code !== 0) && attempts.at(-1)?.exit_code !== 0) {
      count += 1;
    }
  }
  return count;
}

function verdictIcon(verdict: SessionVerdict): string {
  if (verdict === 'READY') return 'OK';
  if (verdict === 'UNSTABLE') return 'UNSTABLE';
  return 'UNVERIFIED';
}
