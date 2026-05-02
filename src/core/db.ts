import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { getAgentRunDir, getDbPath, getReportsDir } from './paths.js';
import { commandColumnMigrations, schemaSql } from './schema.js';

export type LedgerDb = DatabaseSync;

export function initLedger(cwd: string): string {
  fs.mkdirSync(getAgentRunDir(cwd), { recursive: true });
  fs.mkdirSync(getReportsDir(cwd), { recursive: true });
  const dbPath = getDbPath(cwd);
  const db = openDb(dbPath);
  db.exec(schemaSql);
  migrateSchema(db);
  db.close();
  return dbPath;
}

export function isInitialized(cwd: string): boolean {
  return fs.existsSync(getDbPath(cwd));
}

export function openLedgerDb(cwd: string): LedgerDb {
  if (!isInitialized(cwd)) {
    throw new Error('AgentRun Ledger is not initialized. Run: agentrun init');
  }
  const db = openDb(getDbPath(cwd));
  db.exec(schemaSql);
  migrateSchema(db);
  return db;
}

export function openDb(dbPath: string): LedgerDb {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

export function migrateSchema(db: LedgerDb): void {
  const columns = db.prepare('PRAGMA table_info(commands)').all() as Array<{ name: string }>;
  const existing = new Set(columns.map((column) => column.name));

  for (const migration of commandColumnMigrations) {
    if (!existing.has(migration.name)) {
      db.exec(`ALTER TABLE commands ADD COLUMN ${migration.name} ${migration.definition}`);
    }
  }

  db.exec('DROP TABLE IF EXISTS ai_usage;');
}
