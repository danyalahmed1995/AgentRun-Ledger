import { addNote } from '../../core/sessionService.js';

export function noteCommand(text: string): void {
  const note = addNote(process.cwd(), text);
  console.log(`Added note to session #${note.session_id}.`);
}
