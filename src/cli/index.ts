#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { snapshotCommand } from './commands/snapshot.js';
import { runCommand } from './commands/run.js';
import { noteCommand } from './commands/note.js';
import { statusCommand } from './commands/status.js';
import { reportCommand } from './commands/report.js';
import { listCommand } from './commands/list.js';
import { dashboardCommand } from './commands/dashboard.js';
import { closeCommand } from './commands/close.js';

const program = new Command();

program
  .name('agentrun')
  .description('Local session receipts for AI coding agents.')
  .version('0.1.0');

program.command('init').description('Initialize AgentRun Ledger in this Git repository.').action(wrap(initCommand));
program.command('start').argument('<title>').description('Start a new tracked session.').action(wrap(startCommand));
program.command('snapshot').argument('<kind>').description('Capture a before or after Git snapshot.').action(wrap(snapshotCommand));
program.command('run').argument('<command>').description('Run a shell command and log the result.').action(wrap(runCommand));
program.command('note').argument('<text>').description('Add a note to the active session.').action(wrap(noteCommand));
program.command('status').description('Show the active session summary.').action(wrap(statusCommand));
program.command('report').description('Generate a Markdown report for the active session.').action(wrap(reportCommand));
program.command('close').description('Close the active session and generate its report.').action(wrap(closeCommand));
program.command('list').description('List previous sessions.').action(wrap(listCommand));
program.command('dashboard').option('--port <port>', 'Port to listen on', '3765').description('Start the dashboard server.').action(wrap(dashboardCommand));

program.parseAsync(process.argv);

function wrap<T extends unknown[]>(handler: (...args: T) => Promise<void> | void) {
  return async (...args: T) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  };
}
