import { runLoggedCommand } from '../../core/commandRunner.js';
import { logCommandResult, requireActiveSession } from '../../core/sessionService.js';

export async function runCommand(command: string): Promise<void> {
  const session = requireActiveSession(process.cwd());
  console.log(`Running: ${command}`);
  const result = await runLoggedCommand(command, process.cwd(), { liveOutput: true });
  logCommandResult(process.cwd(), result, session.id);
  if (result.exit_code === 0) {
    console.log('Command passed.');
  } else {
    console.log(`Command failed with exit code ${result.exit_code}`);
    process.exitCode = result.exit_code;
  }
  console.log(`Logged command result in session #${session.id}.`);
}
