import path from 'node:path';
import { generateReportFile } from '../../core/reportGenerator.js';
import { requireActiveSession } from '../../core/sessionService.js';

export function reportCommand(): void {
  const session = requireActiveSession(process.cwd());
  const reportPath = generateReportFile(process.cwd(), session.id);
  console.log(`Generated report: ${path.relative(process.cwd(), reportPath)}`);
}
