import { execFileSync } from 'node:child_process';
import { formatFileChangePath, parseFileChanges } from './fileChanges.js';

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trimEnd();
}

export function isGitRepo(cwd: string): boolean {
  try {
    return git(cwd, ['rev-parse', '--is-inside-work-tree']).trim() === 'true';
  } catch {
    return false;
  }
}

export function assertGitRepo(cwd: string): void {
  if (!isGitRepo(cwd)) {
    throw new Error('AgentRun Ledger must be used inside a Git repository.');
  }
}

export function getBranchName(cwd: string): string | null {
  try {
    const branch = git(cwd, ['branch', '--show-current']).trim();
    return branch || null;
  } catch {
    return null;
  }
}

export function getCurrentCommit(cwd: string): string | null {
  try {
    return git(cwd, ['rev-parse', 'HEAD']).trim() || null;
  } catch {
    return null;
  }
}

export function getGitStatus(cwd: string): string {
  try {
    return git(cwd, ['status', '--short', '--untracked-files=all']);
  } catch {
    return '';
  }
}

export function getGitDiff(cwd: string): string {
  try {
    return git(cwd, ['diff', '--no-ext-diff']);
  } catch {
    return '';
  }
}

export function getGitDiffStat(cwd: string): string {
  try {
    return git(cwd, ['diff', '--name-status', '--find-renames', '--find-copies', 'HEAD', '--no-ext-diff']);
  } catch {
    return '';
  }
}

export function getChangedFilesFromDiffStat(diffStat: string): string[] {
  return parseFileChanges(diffStat).map(formatFileChangePath);
}

export function getChangedFilesFromDiffStatLegacy(diffStat: string): string[] {
  return diffStat
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.includes(' file changed') && !line.includes(' files changed'))
    .map((line) => line.split('|')[0]?.trim())
    .filter((file): file is string => Boolean(file));
}
