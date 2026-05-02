import express from 'express';
import type { Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { generateReportFile, generateReportMarkdown } from '../core/reportGenerator.js';
import { getReportPath } from '../core/paths.js';
import { getSessionDetail, listSessions } from '../core/sessionService.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createDashboardApp(cwd: string): Promise<Express> {
  const app = express();
  app.use(express.json());

  app.get('/api/sessions', (_req, res) => {
    res.json(listSessions(cwd));
  });

  app.get('/api/sessions/:id', (req, res) => {
    const detail = getSessionDetail(cwd, Number(req.params.id));
    if (!detail) return res.status(404).json({ error: 'Session not found.' });
    res.json(detail);
  });

  app.get('/api/sessions/:id/report', (req, res) => {
    const id = Number(req.params.id);
    const reportPath = getReportPath(cwd, id);
    if (fs.existsSync(reportPath)) return res.type('text/markdown').send(fs.readFileSync(reportPath, 'utf8'));
    const detail = getSessionDetail(cwd, id);
    if (!detail) return res.status(404).json({ error: 'Session not found.' });
    res.type('text/markdown').send(generateReportMarkdown(detail));
  });

  app.post('/api/sessions/:id/report', (req, res) => {
    const id = Number(req.params.id);
    const reportPath = generateReportFile(cwd, id);
    res.json({ path: reportPath, markdown: fs.readFileSync(reportPath, 'utf8') });
  });

  const builtDashboard = resolveBuiltDashboardPath(cwd);
  if (builtDashboard) {
    app.use(express.static(builtDashboard));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(builtDashboard, 'index.html')));
  } else {
    const vite = await createViteServer({
      root: path.resolve(cwd, 'src/dashboard'),
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  return app;
}

export async function startDashboardServer(cwd: string, port = 3765): Promise<void> {
  const app = await createDashboardApp(cwd);
  await new Promise<void>((resolve) => {
    app.listen(port, '127.0.0.1', () => {
      console.log(`AgentRun dashboard running at http://127.0.0.1:${port}`);
      resolve();
    });
  });
}

export function resolveBuiltDashboardPath(cwd: string): string | null {
  const candidates = [
    path.resolve(dirname, '../dashboard'),
    path.resolve(dirname, '../../dist/dashboard'),
    path.resolve(cwd, 'dist/dashboard')
  ];

  for (const candidate of candidates) {
    if (hasBuiltDashboardAssets(candidate)) return candidate;
  }

  return null;
}

function hasBuiltDashboardAssets(candidate: string): boolean {
  const indexPath = path.join(candidate, 'index.html');
  const assetsPath = path.join(candidate, 'assets');
  return fs.existsSync(indexPath) && fs.existsSync(assetsPath);
}
