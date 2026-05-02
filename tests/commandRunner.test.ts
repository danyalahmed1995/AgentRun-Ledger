import { describe, expect, it } from 'vitest';
import { runLoggedCommand } from '../src/core/commandRunner.js';

describe('command runner', () => {
  it('captures successful command output', async () => {
    const result = await runLoggedCommand('node -e "console.log(\'hello\')"', process.cwd());
    expect(result.exit_code).toBe(0);
    expect(result.stdout).toContain('hello');
    expect(result.command_type).toBe('custom');
    expect(result.cwd).toBe(process.cwd());
    expect(result.environment_json).toContain('node');
  });

  it('captures failed command exit code and does not throw', async () => {
    const result = await runLoggedCommand('node -e "process.exit(2)"', process.cwd());
    expect(result.exit_code).toBe(2);
  });

  it('captures stderr', async () => {
    const result = await runLoggedCommand('node -e "console.error(\'bad\'); process.exit(2)"', process.cwd());
    expect(result.stderr).toContain('bad');
    expect(result.failure_reason).toBeTruthy();
  });

  it('measures duration', async () => {
    const result = await runLoggedCommand('node -e "console.log(\'ok\')"', process.cwd());
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });
});
