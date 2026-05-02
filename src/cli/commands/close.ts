import path from 'node:path';
import { generateReportFile } from '../../core/reportGenerator.js';
import { closeActiveSession } from '../../core/sessionService.js';

export function closeCommand(): void {
  const session = closeActiveSession(process.cwd());
  const reportPath = generateReportFile(process.cwd(), session.id);
  console.log(`Closed session #${session.id}: ${session.title}`);
  console.log(`Generated report: ${path.relative(process.cwd(), reportPath)}`);
}
