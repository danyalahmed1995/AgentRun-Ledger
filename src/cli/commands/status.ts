import { getCurrentOrLatestSessionSummary } from '../../core/sessionService.js';
import { formatDuration } from '../../core/time.js';

export function statusCommand(): void {
  const summary = getCurrentOrLatestSessionSummary(process.cwd());
  const label = summary.session.status === 'completed' ? 'Completed session' : 'Active session';
  console.log(`${label} #${summary.session.id}: ${summary.session.title}`);
  console.log(`Status: ${summary.session.status}`);
  if (summary.session.ended_at) {
    console.log(`Ended: ${summary.session.ended_at}`);
    console.log(`Duration: ${formatDuration(summary.session.started_at, summary.session.ended_at)}`);
  }
  console.log(`Commands: ${summary.commandCount} total, ${summary.passedCount} passed, ${summary.failedCount} failed`);
  console.log(`Files changed: ${summary.filesChanged}`);
  if (summary.lastCommand) {
    console.log(`Last command: ${summary.lastCommand.command} - ${summary.lastCommand.exit_code === 0 ? 'passed' : 'failed'}`);
  } else {
    console.log('Last command: none');
  }
}
