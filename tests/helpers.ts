import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

export function tempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function runGit(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

export function initGitRepo(): string {
  const cwd = tempDir('agentrun-git-');
  runGit(cwd, ['init']);
  runGit(cwd, ['config', 'user.email', 'test@example.com']);
  runGit(cwd, ['config', 'user.name', 'Test User']);
  fs.writeFileSync(path.join(cwd, 'index.js'), "console.log('hello')\n");
  runGit(cwd, ['add', '.']);
  runGit(cwd, ['commit', '-m', 'initial commit']);
  return cwd;
}

export function cli(cwd: string, args: string[]) {
  const cliPath = path.resolve('src/cli/index.ts');
  const tsxPath = path.resolve('node_modules/tsx/dist/cli.mjs');
  return spawnSync(process.execPath, [tsxPath, cliPath, ...args], {
    cwd,
    encoding: 'utf8'
  });
}
