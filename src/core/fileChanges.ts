import type { FileChange, FileChangeStatus } from './types.js';

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
      status: code === 'R' ? 'renamed' : 'copied'
    };
  }

  const path = parts[1];
  const status = mapGitStatus(code);
  return path && status ? { path, status } : null;
}

function parseStatusShortLine(line: string): FileChange | null {
  if (!line.trim()) return null;
  if (line.startsWith('?? ')) return { path: line.slice(3).trim(), status: 'added' };

  const statusCode = line.slice(0, 2);
  const pathText = line.slice(3).trim();
  if (!pathText) return null;

  const renameMatch = pathText.match(/^(.+?) -> (.+)$/);
  if (renameMatch) {
    return {
      previousPath: renameMatch[1],
      path: renameMatch[2],
      status: statusCode.includes('R') ? 'renamed' : 'copied'
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

  return status ? { path: pathText, status } : null;
}

function mapGitStatus(code: string): FileChangeStatus | null {
  if (code === 'M') return 'modified';
  if (code === 'A') return 'added';
  if (code === 'D') return 'deleted';
  if (code === 'R') return 'renamed';
  if (code === 'C') return 'copied';
  return null;
}
