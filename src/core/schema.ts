export const schemaSql = `
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TEXT NOT NULL,
  ended_at TEXT NULL,
  repo_path TEXT NOT NULL,
  branch_name TEXT NULL,
  start_commit TEXT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  initial_status TEXT NULL,
  initial_diff TEXT NULL,
  before_status TEXT NULL,
  before_diff TEXT NULL,
  before_diff_stat TEXT NULL,
  after_status TEXT NULL,
  after_diff TEXT NULL,
  after_diff_stat TEXT NULL
);

CREATE TABLE IF NOT EXISTS commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  command TEXT NOT NULL,
  exit_code INTEGER NOT NULL,
  stdout TEXT NULL,
  stderr TEXT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  command_type TEXT NULL,
  attempt INTEGER NULL,
  cwd TEXT NULL,
  environment_json TEXT NULL,
  output_summary_json TEXT NULL,
  failure_reason TEXT NULL,
  git_status_before TEXT NULL,
  git_status_after TEXT NULL,
  git_diff_stat TEXT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  git_status TEXT NULL,
  git_diff TEXT NULL,
  git_diff_stat TEXT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(active);
CREATE INDEX IF NOT EXISTS idx_commands_session ON commands(session_id);
CREATE INDEX IF NOT EXISTS idx_notes_session ON notes(session_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_session ON snapshots(session_id);
`;

export const commandColumnMigrations: Array<{ name: string; definition: string }> = [
  { name: 'command_type', definition: 'TEXT NULL' },
  { name: 'attempt', definition: 'INTEGER NULL' },
  { name: 'cwd', definition: 'TEXT NULL' },
  { name: 'environment_json', definition: 'TEXT NULL' },
  { name: 'output_summary_json', definition: 'TEXT NULL' },
  { name: 'failure_reason', definition: 'TEXT NULL' },
  { name: 'git_status_before', definition: 'TEXT NULL' },
  { name: 'git_status_after', definition: 'TEXT NULL' },
  { name: 'git_diff_stat', definition: 'TEXT NULL' }
];
