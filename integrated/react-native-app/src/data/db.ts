// قاعدة البيانات — منقولة من data/local/database/AppDatabase.kt (db name = osamah_agent_database)
// ملاحظة: Room تُستخدم بدون @ColumnInfo ⇒ أسماء الأعمدة هي أسماء خصائص Kotlin (camelCase).
import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'osamah_agent_database';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(SCHEMA);
  await migrate(db);
  return db;
}

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  country TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  jobTitle TEXT NOT NULL DEFAULT '',
  field TEXT NOT NULL DEFAULT '',
  specialization TEXT NOT NULL DEFAULT '',
  experienceLevel TEXT NOT NULL DEFAULT '',
  primaryGoal TEXT NOT NULL DEFAULT '',
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 1,
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversationId TEXT NOT NULL,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  toolName TEXT,
  toolInput TEXT,
  toolResult TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  sourcesJson TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  createdAt INTEGER NOT NULL,
  completedAt INTEGER
);

CREATE TABLE IF NOT EXISTS task_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskId TEXT NOT NULL,
  stepNumber INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  toolRequired TEXT NOT NULL DEFAULT 'NONE',
  status TEXT NOT NULL DEFAULT 'PENDING',
  output TEXT
);

CREATE TABLE IF NOT EXISTS presentations (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  themeColor TEXT NOT NULL DEFAULT '#00F0FF',
  createdAt INTEGER NOT NULL,
  slidesCount INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  presentationId TEXT NOT NULL,
  slideNumber INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  bulletPointsJson TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  iconName TEXT NOT NULL DEFAULT 'auto_awesome'
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actionName TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'APP',
  details TEXT NOT NULL DEFAULT '',
  timestamp INTEGER NOT NULL,
  userConfirmed INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS voice_settings (
  id INTEGER PRIMARY KEY NOT NULL,
  voiceGender TEXT NOT NULL DEFAULT 'male',
  accent TEXT NOT NULL DEFAULT 'syrian',
  speechRate REAL NOT NULL DEFAULT 1.0,
  pitch REAL NOT NULL DEFAULT 1.0,
  volume REAL NOT NULL DEFAULT 1.0,
  selectedBubbleId INTEGER NOT NULL DEFAULT 1,
  bargeInEnabled INTEGER NOT NULL DEFAULT 1,
  voiceResponsesEnabled INTEGER NOT NULL DEFAULT 1,
  continuousListening INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'ar',
  noiseSensitivity REAL NOT NULL DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  uri TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  sizeBytes INTEGER NOT NULL DEFAULT 0,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'READY',
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
  ON messages(conversationId, timestamp);
CREATE INDEX IF NOT EXISTS idx_memories_category_importance_time
  ON memories(category, importance, timestamp);
CREATE INDEX IF NOT EXISTS idx_task_steps_task_number
  ON task_steps(taskId, stepNumber);
CREATE INDEX IF NOT EXISTS idx_slides_presentation_number
  ON slides(presentationId, slideNumber);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_tasks_status_created
  ON tasks(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_artifacts_kind_created
  ON artifacts(kind, createdAt);
`;

const MIGRATIONS: Array<{ table: string; column: string; ddl: string }> = [
  { table: 'voice_settings', column: 'voiceResponsesEnabled', ddl: 'ALTER TABLE voice_settings ADD COLUMN voiceResponsesEnabled INTEGER NOT NULL DEFAULT 1' },
  { table: 'voice_settings', column: 'continuousListening', ddl: 'ALTER TABLE voice_settings ADD COLUMN continuousListening INTEGER NOT NULL DEFAULT 0' },
  { table: 'voice_settings', column: 'language', ddl: 'ALTER TABLE voice_settings ADD COLUMN language TEXT NOT NULL DEFAULT \'ar\'' },
  { table: 'voice_settings', column: 'noiseSensitivity', ddl: 'ALTER TABLE voice_settings ADD COLUMN noiseSensitivity REAL NOT NULL DEFAULT 0.5' },
];

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const hasColumn = async (table: string, column: string): Promise<boolean> => {
    const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    return rows.some((r) => r.name === column);
  };
  for (const m of MIGRATIONS) {
    if (!(await hasColumn(m.table, m.column))) {
      await db.execAsync(m.ddl);
    }
  }
}
