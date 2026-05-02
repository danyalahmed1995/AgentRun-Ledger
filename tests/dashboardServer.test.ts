import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { build } from 'vite';
import { createDashboardApp } from '../src/server/dashboardServer.js';
import { initialize, logCommandResult, startSession } from '../src/core/sessionService.js';
import { initGitRepo } from './helpers.js';

describe('dashboard server', () => {
  let cwd: string;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await build({ configFile: path.resolve('vite.config.ts') });

    cwd = initGitRepo();
    initialize(cwd);
    const session = startSession(cwd, 'dashboard smoke');
    const now = new Date().toISOString();
    logCommandResult(cwd, {
      command: 'npm test',
      exit_code: 0,
      stdout: '1 passed',
      stderr: '',
      started_at: now,
      ended_at: now,
      duration_ms: 1
    }, session.id);
    const app = await createDashboardApp(cwd);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Unable to resolve dashboard test port.');
    baseUrl = `http://127.0.0.1:${address.port}`;
  }, 60000);

  afterAll(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it('returns sessions as JSON', async () => {
    const response = await fetch(`${baseUrl}/api/sessions`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const sessions = await response.json() as unknown[];
    expect(sessions.length).toBeGreaterThan(0);
  });

  it('serves dashboard HTML with root div', async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<div id="root"></div>');
  });

  it('returns command logging metadata in session detail', async () => {
    const response = await fetch(`${baseUrl}/api/sessions/1`);
    expect(response.status).toBe(200);
    const detail = await response.json() as { commands: Array<Record<string, unknown>> };
    expect(detail.commands[0]).toEqual(expect.objectContaining({
      command_type: expect.any(String),
      attempt: expect.any(Number),
      output_summary_json: expect.any(String)
    }));
  });

  it('does not return AI usage summary in session detail', async () => {
    const response = await fetch(`${baseUrl}/api/sessions/1`);
    expect(response.status).toBe(200);
    const detail = await response.json() as Record<string, unknown>;
    expect(detail.aiUsage).toBeUndefined();
  });

  it('serves the built JS asset referenced by index.html', async () => {
    const html = await fetch(`${baseUrl}/`).then((response) => response.text());
    const assetMatch = html.match(/<script[^>]+src="([^"]+\.js)"/);
    expect(assetMatch?.[1]).toBeTruthy();

    const assetPath = assetMatch![1];
    const builtPath = path.join(path.resolve('dist/dashboard'), assetPath.replace(/^\//, ''));
    expect(fs.existsSync(builtPath)).toBe(true);

    const response = await fetch(`${baseUrl}${assetPath}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('javascript');
  });
});
