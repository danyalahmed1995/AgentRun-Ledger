import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFileChanges } from '../src/core/fileChanges.js';
import { getBranchName, getChangedFilesFromDiffStat, getCurrentCommit, getGitDiff, getGitDiffStat, getGitStatus, isGitRepo } from '../src/core/git.js';
import { initGitRepo, tempDir, runGit } from './helpers.js';

describe('git utilities', () => {
  it('detects Git repository', () => {
    expect(isGitRepo(initGitRepo())).toBe(true);
  });

  it('returns current branch', () => {
    expect(getBranchName(initGitRepo())).toBeTruthy();
  });

  it('returns current commit', () => {
    expect(getCurrentCommit(initGitRepo())).toMatch(/[a-f0-9]{40}/);
  });

  it('captures status after file change', () => {
    const cwd = initGitRepo();
    fs.writeFileSync(path.join(cwd, 'new.txt'), 'new');
    expect(getGitStatus(cwd)).toContain('new.txt');
  });

  it('captures diff after modifying a tracked file', () => {
    const cwd = initGitRepo();
    fs.writeFileSync(path.join(cwd, 'index.js'), "console.log('changed')\n");
    expect(getGitDiff(cwd)).toContain('changed');
  });

  it('captures name-status and parses modified files', () => {
    const cwd = initGitRepo();
    fs.writeFileSync(path.join(cwd, 'index.js'), "console.log('changed')\n");
    const nameStatus = getGitDiffStat(cwd);
    expect(nameStatus).toContain('M\tindex.js');
    expect(parseFileChanges(nameStatus)).toContainEqual({ path: 'index.js', status: 'modified' });
    expect(getChangedFilesFromDiffStat(nameStatus)).toContain('index.js');
  });

  it('returns clear behavior outside Git repo', () => {
    const cwd = tempDir('agentrun-no-git-');
    expect(isGitRepo(cwd)).toBe(false);
    expect(getGitStatus(cwd)).toBe('');
  });

  it('parses added, modified, deleted, renamed, and untracked files', () => {
    const cwd = initGitRepo();
    fs.writeFileSync(path.join(cwd, 'a.txt'), 'a');
    fs.writeFileSync(path.join(cwd, 'mod.txt'), 'original');
    runGit(cwd, ['add', '.']);
    runGit(cwd, ['commit', '-m', 'add fixture files']);

    fs.writeFileSync(path.join(cwd, 'mod.txt'), 'changed');
    fs.writeFileSync(path.join(cwd, 'added.txt'), 'added');
    runGit(cwd, ['add', 'added.txt']);
    fs.unlinkSync(path.join(cwd, 'index.js'));
    runGit(cwd, ['mv', 'a.txt', 'renamed.txt']);
    fs.writeFileSync(path.join(cwd, 'untracked.txt'), 'untracked');

    const changes = parseFileChanges(getGitDiffStat(cwd), getGitStatus(cwd));
    expect(changes).toEqual(expect.arrayContaining([
      { path: 'added.txt', status: 'added' },
      { path: 'mod.txt', status: 'modified' },
      { path: 'index.js', status: 'deleted' },
      { path: 'renamed.txt', previousPath: 'a.txt', status: 'renamed' },
      { path: 'untracked.txt', status: 'added' }
    ]));
  });
});
