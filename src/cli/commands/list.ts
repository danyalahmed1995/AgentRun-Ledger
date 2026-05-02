import { listSessions } from '../../core/sessionService.js';

export function listCommand(): void {
  const sessions = listSessions(process.cwd());
  if (sessions.length === 0) {
    console.log('No AgentRun sessions found.');
    return;
  }
  for (const summary of sessions) {
    const started = summary.session.started_at.slice(0, 16).replace('T', ' ');
    console.log(`#${summary.session.id} ${summary.session.status.padEnd(7)} ${summary.session.title.padEnd(32)} ${started}`);
  }
}
