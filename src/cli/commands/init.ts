import path from 'node:path';
import { initialize } from '../../core/sessionService.js';

export function initCommand(): void {
  const dbPath = initialize(process.cwd());
  console.log('AgentRun Ledger initialized.');
  console.log(`Database: ${path.relative(process.cwd(), dbPath)}`);
}
