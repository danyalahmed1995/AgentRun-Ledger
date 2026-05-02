import fs from 'node:fs';
import path from 'node:path';
import { getReportPath } from './paths.js';
import { generateReviewFindings } from './reviewHeuristics.js';
import { captureSnapshot, getSessionDetail } from './sessionService.js';
import { formatFileChangePath, parseFileChanges } from './fileChanges.js';
import { assessSession, hasValidationCommand } from './sessionAssessment.js';
import { formatDuration } from './time.js';
import type { CommandRecord, SessionDetail } from './types.js';

export function generateReportMarkdown(detail: SessionDetail): string {
  const diffStat = detail.after_diff_stat ?? detail.before_diff_stat ?? '';
  const rawDiff = detail.after_diff ?? detail.before_diff ?? detail.initial_diff ?? '';
  const fileChanges = parseFileChanges(diffStat, detail.after_status ?? detail.before_status ?? '');
  const changedFiles = fileChanges.map((change) => formatFileChangePath(change));
  const findings = generateReviewFindings({
    changedFiles,
    commands: detail.commands,
    diffStat,
    rawDiff
  });
  const failed = detail.commands.filter((command) => command.exit_code !== 0);
  const passed = detail.commands.filter((command) => command.exit_code === 0);
  const assessment = assessSession(detail);

  return [
    `# AgentRun Report: ${detail.title}`,
    '',
    `Final Verdict: ${formatVerdict(assessment.verdict)}`,
    'Reason:',
    assessment.verdictReason.map((reason) => `- ${reason}`).join('\n'),
    '',
    `Session Score: ${assessment.score}/10`,
    '',
    'Score breakdown:',
    assessment.scoreBreakdown.map((item) => `- ${scoreIcon(item)} ${item}`).join('\n'),
    '',
    '## Top summary',
    '',
    `- Commands: ${detail.commands.length}`,
    `- Failed commands: ${failed.length}`,
    `- Retries: ${countRepeatedCommands(detail.commands)}`,
    `- Validation status: ${assessment.hasValidation ? 'performed' : 'not performed'}`,
    '',
    '## Session metadata',
    '',
    `- Session: #${detail.id}`,
    `- Status: ${detail.status}`,
    `- Started: ${formatDate(detail.started_at)}`,
    `- Ended: ${detail.ended_at ? formatDate(detail.ended_at) : 'Not ended'}`,
    `- Duration: ${formatDuration(detail.started_at, detail.ended_at)}`,
    `- Repository: ${detail.repo_path}`,
    `- Branch: ${detail.branch_name ?? 'unknown'}`,
    `- Start commit: ${detail.start_commit ?? 'unknown'}`,
    '',
    '## Goal',
    '',
    detail.title,
    '',
    '## Summary',
    '',
    `- Changed files: ${changedFiles.length}`,
    `- Commands logged: ${detail.commands.length}`,
    `- Passed commands: ${passed.length}`,
    `- Failed commands: ${failed.length}`,
    rawDiff.trim() ? '' : '- No tracked changes were found in the final diff.',
    assessment.hasValidation ? '' : '- Strong warning: no validation command was logged for this session.',
    '',
    '## Retry insights',
    '',
    retryInsights(detail.commands),
    '',
    '## Files changed',
    '',
    fileChanges.length ? fileChanges.map(formatFileChangeForReport).join('\n') : '_No file changes detected._',
    '',
    '## Command timeline',
    '',
    detail.commands.length ? detail.commands.map(formatCommand).join('\n\n') : '_No commands were logged._',
    '',
    '## Failed commands',
    '',
    failed.length ? failed.map(formatCommandBrief).join('\n') : '_No failed commands._',
    '',
    '## Passed commands',
    '',
    passed.length ? passed.map(formatCommandBrief).join('\n') : '_No passed commands._',
    '',
    '## Git name status',
    '',
    fenced(diffStat || 'No diff stat available.'),
    '',
    '## Human notes',
    '',
    detail.notes.length ? detail.notes.map((note) => `- ${formatDate(note.created_at)}: ${note.note}`).join('\n') : '_No notes recorded._',
    '',
    '## Review risks',
    '',
    findings.length
      ? findings.map((finding) => `- **${finding.severity.toUpperCase()}: ${finding.title}** - ${finding.detail}`).join('\n')
      : '_No deterministic review risks detected._',
    '',
    '## Suggested follow-up',
    '',
    suggestedFollowup(detail.commands, changedFiles),
    '',
    '## Final raw diff',
    '',
    '<details>',
    '<summary>Show raw diff</summary>',
    '',
    fenced(rawDiff || 'No tracked diff available.'),
    '',
    '</details>',
    ''
  ].filter((line) => line !== undefined).join('\n');
}

export function generateReportFile(cwd: string, sessionId: number): string {
  captureSnapshot(cwd, 'after', sessionId);
  const detail = getSessionDetail(cwd, sessionId);
  if (!detail) throw new Error(`Session #${sessionId} not found.`);
  const markdown = generateReportMarkdown(detail);
  const reportPath = getReportPath(cwd, sessionId);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, markdown, 'utf8');
  return reportPath;
}

function formatCommand(command: CommandRecord): string {
  const status = commandStatus(command);
  const environment = parseJson<{ branch?: string | null; commit?: string | null }>(command.environment_json);
  const outputSummary = parseJson<Record<string, unknown>>(command.output_summary_json);
  const output = [command.stdout?.trim(), command.stderr?.trim()].filter(Boolean).join('\n');
  return [
    `### Attempt ${command.attempt ?? 1} - ${command.command}`,
    '',
    `- Type: ${command.command_type ?? 'custom'}`,
    `- Status: ${status}`,
    `- Exit code: ${command.exit_code}`,
    `- Duration: ${command.duration_ms}ms`,
    `- CWD: ${command.cwd ?? 'unknown'}`,
    `- Branch: ${environment?.branch ?? 'unknown'}`,
    `- Commit: ${environment?.commit ?? 'unknown'}`,
    `- Started: ${formatDate(command.started_at)}`,
    command.failure_reason ? `- Failure reason: ${command.failure_reason}` : '- Failure reason: none',
    '',
    'Output summary:',
    ...formatOutputSummary(outputSummary),
    '',
    'Insight:',
    commandInsight(command),
    '',
    output ? fenced(truncate(output, 3000)) : '_No output captured._'
  ].join('\n');
}

function formatCommandBrief(command: CommandRecord): string {
  return `- \`${command.command}\` - exit ${command.exit_code}, ${command.duration_ms}ms`;
}

function formatFileChangeForReport(change: ReturnType<typeof parseFileChanges>[number]): string {
  const icon = change.status === 'modified'
    ? '🟢'
    : change.status === 'added'
      ? '🟡'
      : change.status === 'deleted'
        ? '🔴'
        : '🔵';
  return `- ${icon} ${formatFileChangePath(change)} (${change.status})`;
}

function fenced(text: string): string {
  return ['```txt', text, '```'].join('\n');
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}\n...truncated...` : text;
}

function formatDate(value: string): string {
  return new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}

function suggestedFollowup(commands: CommandRecord[], changedFiles: string[]): string {
  const failed = commands.filter((command) => command.exit_code !== 0);
  if (failed.length > 0) return 'Resolve or explain failed commands before relying on this session.';
  if (commands.length === 0 || !hasValidationCommand(commands)) return 'Run a validation command and regenerate the report.';
  if (changedFiles.length === 0) return 'Confirm whether the task produced no tracked repository changes.';
  return 'Review the changed files and keep the report with the pull request or commit notes.';
}

function commandStatus(command: CommandRecord): string {
  if (command.exit_code !== 0) return 'FAILED';
  return hasPreviousFailure(command) ? 'FAILED -> PASSED' : 'PASSED';
}

function commandInsight(command: CommandRecord): string {
  if (command.exit_code === 0 && hasPreviousFailure(command)) {
    return `Agent resolved the issue after ${command.attempt ?? 1} attempts.`;
  }
  if (command.exit_code !== 0) return `Command is still failing${command.failure_reason ? ` with ${command.failure_reason}` : ''}.`;
  return 'Command completed successfully.';
}

function hasPreviousFailure(command: CommandRecord): boolean {
  return Boolean(command.attempt && command.attempt > 1 && command.exit_code === 0);
}

function formatOutputSummary(summary: Record<string, unknown> | null): string[] {
  if (!summary) return ['- No output summary available.'];
  return [
    `- has_errors: ${String(summary.has_errors ?? false)}`,
    `- has_warnings: ${String(summary.has_warnings ?? false)}`,
    `- passed_tests: ${summary.passed_tests ?? 'unknown'}`,
    `- failed_tests: ${summary.failed_tests ?? 'unknown'}`,
    `- keywords: ${Array.isArray(summary.keywords) && summary.keywords.length ? summary.keywords.join(', ') : 'none'}`
  ];
}

function retryInsights(commands: CommandRecord[]): string {
  const byCommand = new Map<string, CommandRecord[]>();
  for (const command of commands) {
    byCommand.set(command.command, [...(byCommand.get(command.command) ?? []), command]);
  }

  const insights: string[] = [];
  for (const [command, attempts] of byCommand) {
    if (attempts.length < 2) continue;
    const hadFailure = attempts.some((attempt) => attempt.exit_code !== 0);
    const latest = attempts.at(-1)!;
    if (hadFailure && latest.exit_code === 0) {
      insights.push(`- Agent resolved the issue after ${attempts.length} attempts for \`${command}\`.`);
    } else if (hadFailure) {
      insights.push(`- Agent failed to resolve the issue after ${attempts.length} attempts for \`${command}\`.`);
    } else {
      insights.push(`- \`${command}\` was retried ${attempts.length} times without failures.`);
    }
  }

  return insights.length ? insights.join('\n') : '_No repeated command attempts recorded._';
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function formatVerdict(verdict: string): string {
  if (verdict === 'READY') return '✅ READY';
  if (verdict === 'UNSTABLE') return '❌ UNSTABLE';
  return '⚠️ UNVERIFIED';
}

function scoreIcon(item: string): string {
  return item.includes('No score') ? '✅' : '❌';
}

function countRepeatedCommands(commands: CommandRecord[]): number {
  const counts = new Map<string, number>();
  for (const command of commands) counts.set(command.command, (counts.get(command.command) ?? 0) + 1);
  return [...counts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
}
