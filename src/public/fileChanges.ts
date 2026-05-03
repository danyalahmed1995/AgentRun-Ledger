import type { FileChange, FileChangeStatus } from './types.js';

export const MANY_UNTRACKED_FILES_THRESHOLD = 10;

export function parseFileChanges(nameStatus: string, statusShort = ''): FileChange[] {
  const changes = new Map<string, FileChange>();

  for (const line of nameStatus.split(/\r?\n/)) {
    const change = parseNameStatusLine(line);
    if (change) changes.set(change.path, change);
  }

  for (const line of statusShort.split(/\r?\n/)) {
    const change = parseStatusShortLine(line);
    if (change && !changes.has(change.path)) changes.set(change.path, change);
  }

  return [...changes.values()];
}

export function formatFileChangePath(change: FileChange): string {
  return change.previousPath ? `${change.previousPath} -> ${change.path}` : change.path;
}

export function hasManyUntrackedFiles(changes: FileChange[]): boolean {
  return countUntrackedFiles(changes) > MANY_UNTRACKED_FILES_THRESHOLD;
}

export function countUntrackedFiles(changes: FileChange[]): number {
  return changes.filter((change) => change.source === 'untracked').length;
}

export function groupFileChanges(changes: FileChange[]): Array<{ title: string; changes: FileChange[] }> {
  return [
    { title: 'Modified', changes: changes.filter((change) => change.status === 'modified') },
    { title: 'Added / Untracked', changes: changes.filter((change) => change.status === 'added') },
    { title: 'Deleted', changes: changes.filter((change) => change.status === 'deleted') },
    { title: 'Renamed', changes: changes.filter((change) => change.status === 'renamed' || change.status === 'copied') }
  ].filter((group) => group.changes.length > 0);
}

function parseNameStatusLine(line: string): FileChange | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\t+/);
  const rawStatus = parts[0] ?? '';
  const code = rawStatus[0];

  if ((code === 'R' || code === 'C') && parts.length >= 3) {
    return {
      previousPath: parts[1],
      path: parts[2],
      status: code === 'R' ? 'renamed' : 'copied',
      source: 'head'
    };
  }

  const path = parts[1];
  const status = mapGitStatus(code);
  return path && status ? { path, status, source: 'head' } : null;
}

function parseStatusShortLine(line: string): FileChange | null {
  if (!line.trim()) return null;
  if (line.startsWith('?? ')) return { path: line.slice(3).trim(), status: 'added', source: 'untracked' };

  const statusCode = line.slice(0, 2);
  const pathText = line.slice(3).trim();
  if (!pathText) return null;

  const renameMatch = pathText.match(/^(.+?) -> (.+)$/);
  if (renameMatch) {
    return {
      previousPath: renameMatch[1],
      path: renameMatch[2],
      status: statusCode.includes('R') ? 'renamed' : 'copied',
      source: 'head'
    };
  }

  const status = statusCode.includes('D')
    ? 'deleted'
    : statusCode.includes('A')
      ? 'added'
      : statusCode.includes('R')
        ? 'renamed'
        : statusCode.includes('C')
          ? 'copied'
          : statusCode.includes('M')
            ? 'modified'
            : null;

  return status ? { path: pathText, status, source: 'head' } : null;
}

function mapGitStatus(code: string): FileChangeStatus | null {
  if (code === 'M') return 'modified';
  if (code === 'A') return 'added';
  if (code === 'D') return 'deleted';
  if (code === 'R') return 'renamed';
  if (code === 'C') return 'copied';
  return null;
}
