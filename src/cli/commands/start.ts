import { startSession } from '../../core/sessionService.js';

export function startCommand(title: string): void {
  const session = startSession(process.cwd(), title);
  console.log(`Started session #${session.id}: ${session.title}`);
}
