import path from 'node:path';

export const AGENTRUN_DIR = '.agentrun';
export const DB_FILENAME = 'agentrun.db';
export const REPORTS_DIR = 'reports';

export function getAgentRunDir(cwd: string): string {
  return path.join(cwd, AGENTRUN_DIR);
}

export function getDbPath(cwd: string): string {
  return path.join(getAgentRunDir(cwd), DB_FILENAME);
}

export function getReportsDir(cwd: string): string {
  return path.join(getAgentRunDir(cwd), REPORTS_DIR);
}

export function getReportPath(cwd: string, sessionId: number): string {
  return path.join(getReportsDir(cwd), `session-${sessionId}.md`);
}
