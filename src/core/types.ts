export type SessionStatus = 'active' | 'closed' | 'completed';

export type Session = {
  id: number;
  title: string;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  repo_path: string;
  branch_name: string | null;
  start_commit: string | null;
  active: number;
  initial_status: string | null;
  initial_diff: string | null;
  before_status: string | null;
  before_diff: string | null;
  before_diff_stat: string | null;
  after_status: string | null;
  after_diff: string | null;
  after_diff_stat: string | null;
};

export type CommandRecord = {
  id: number;
  session_id: number;
  command: string;
  exit_code: number;
  stdout: string | null;
  stderr: string | null;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  command_type: CommandType | null;
  attempt: number | null;
  cwd: string | null;
  environment_json: string | null;
  output_summary_json: string | null;
  failure_reason: FailureReason | null;
  git_status_before: string | null;
  git_status_after: string | null;
  git_diff_stat: string | null;
};

export type CommandType = 'test' | 'build' | 'lint' | 'typecheck' | 'install' | 'custom';

export type FailureReason =
  | 'test_failure'
  | 'build_failure'
  | 'lint_failure'
  | 'typecheck_failure'
  | 'dependency_failure'
  | 'runtime_error'
  | 'runtime_exit_failure'
  | 'unknown_failure';

export type EnvironmentSnapshot = {
  node: string;
  platform: NodeJS.Platform;
  arch: string;
  branch: string | null;
  commit: string | null;
};

export type OutputSummary = {
  keywords: string[];
  passed_tests: number | null;
  failed_tests: number | null;
  has_errors: boolean;
  has_warnings: boolean;
};

export type CommandResult = Pick<
  CommandRecord,
  'command' | 'exit_code' | 'stdout' | 'stderr' | 'started_at' | 'ended_at' | 'duration_ms'
> &
  Partial<
    Pick<
      CommandRecord,
      | 'command_type'
      | 'attempt'
      | 'cwd'
      | 'environment_json'
      | 'output_summary_json'
      | 'failure_reason'
      | 'git_status_before'
      | 'git_status_after'
      | 'git_diff_stat'
    >
  >;

export type Note = {
  id: number;
  session_id: number;
  note: string;
  created_at: string;
};

export type SnapshotKind = 'before' | 'after';

export type Snapshot = {
  id: number;
  session_id: number;
  kind: SnapshotKind;
  git_status: string | null;
  git_diff: string | null;
  git_diff_stat: string | null;
  created_at: string;
};

export type FileChangeStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'copied';

export type FileChange = {
  path: string;
  status: FileChangeStatus;
  previousPath?: string;
  source?: 'head' | 'untracked';
};

export type SessionDetail = Session & {
  commands: CommandRecord[];
  notes: Note[];
  snapshots: Snapshot[];
};

export type SessionSummary = {
  session: Session;
  commandCount: number;
  passedCount: number;
  failedCount: number;
  filesChanged: number;
  lastCommand: CommandRecord | null;
};

export type ReviewFinding = {
  severity: 'info' | 'warning' | 'danger';
  title: string;
  detail: string;
};

export type SessionVerdict = 'READY' | 'UNVERIFIED' | 'UNSTABLE';

export type SessionAssessment = {
  verdict: SessionVerdict;
  verdictIcon: string;
  verdictReason: string[];
  score: number;
  scoreBreakdown: string[];
  hasValidation: boolean;
  failedCommands: number;
  unresolvedRetryFailures: number;
};
