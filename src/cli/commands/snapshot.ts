import { captureSnapshot } from '../../core/sessionService.js';
import type { SnapshotKind } from '../../core/types.js';

export function snapshotCommand(kind: string): void {
  if (kind !== 'before' && kind !== 'after') {
    throw new Error('Snapshot kind must be "before" or "after".');
  }
  const snapshot = captureSnapshot(process.cwd(), kind as SnapshotKind);
  console.log(`Captured ${kind} snapshot for session #${snapshot.session_id}.`);
}
