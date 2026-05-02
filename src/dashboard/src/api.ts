import type { SessionDetail, SessionSummary } from '../../core/types.js';

export async function fetchSessions(): Promise<SessionSummary[]> {
  const response = await fetch('/api/sessions');
  if (!response.ok) throw new Error('Unable to load sessions.');
  return response.json();
}

export async function fetchSession(id: number): Promise<SessionDetail> {
  const response = await fetch(`/api/sessions/${id}`);
  if (!response.ok) throw new Error('Unable to load session.');
  return response.json();
}

export async function fetchReport(id: number): Promise<string> {
  const response = await fetch(`/api/sessions/${id}/report`);
  if (!response.ok) throw new Error('Unable to load report.');
  return response.text();
}

export async function generateReport(id: number): Promise<string> {
  const response = await fetch(`/api/sessions/${id}/report`, { method: 'POST' });
  if (!response.ok) throw new Error('Unable to generate report.');
  const data = (await response.json()) as { markdown: string };
  return data.markdown;
}
