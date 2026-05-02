import { spawn } from 'node:child_process';
import { createEnvironmentSnapshot, detectCommandType, inferFailureReason, summarizeOutput } from './commandAnalysis.js';
import { getGitDiffStat, getGitStatus } from './git.js';
import type { CommandResult } from './types.js';

export function runLoggedCommand(
  command: string,
  cwd: string,
  options: { liveOutput?: boolean } = {}
): Promise<CommandResult> {
  const startedAt = new Date();
  const started = Date.now();
  const gitStatusBefore = getGitStatus(cwd);
  const commandType = detectCommandType(command);
  const environment = createEnvironmentSnapshot(cwd);
  const child = spawn(command, {
    cwd,
    shell: true,
    windowsHide: true
  });

  let stdout = '';
  let stderr = '';

  child.stdout?.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    stdout += text;
    if (options.liveOutput) process.stdout.write(text);
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    stderr += text;
    if (options.liveOutput) process.stderr.write(text);
  });

  return new Promise((resolve) => {
    child.on('error', (error) => {
      const endedAt = new Date();
      const outputSummary = summarizeOutput(stdout, stderr + error.message);
      resolve({
        command,
        exit_code: 1,
        stdout,
        stderr: stderr + error.message,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_ms: Date.now() - started,
        command_type: commandType,
        attempt: null,
        cwd,
        environment_json: JSON.stringify(environment),
        output_summary_json: JSON.stringify(outputSummary),
        failure_reason: inferFailureReason({ exitCode: 1, commandType, outputSummary, stdout, stderr: stderr + error.message }),
        git_status_before: gitStatusBefore,
        git_status_after: getGitStatus(cwd),
        git_diff_stat: getGitDiffStat(cwd)
      });
    });

    child.on('close', (code) => {
      const endedAt = new Date();
      const exitCode = code ?? 1;
      const outputSummary = summarizeOutput(stdout, stderr);
      resolve({
        command,
        exit_code: exitCode,
        stdout,
        stderr,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_ms: Date.now() - started,
        command_type: commandType,
        attempt: null,
        cwd,
        environment_json: JSON.stringify(environment),
        output_summary_json: JSON.stringify(outputSummary),
        failure_reason: inferFailureReason({ exitCode, commandType, outputSummary, stdout, stderr }),
        git_status_before: gitStatusBefore,
        git_status_after: getGitStatus(cwd),
        git_diff_stat: getGitDiffStat(cwd)
      });
    });
  });
}
