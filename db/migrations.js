function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY,
      minute INTEGER NOT NULL,
      hour INTEGER NOT NULL,
      day INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      datetime INTEGER NOT NULL,
      time_zone_offset INTEGER NOT NULL,
      mood INTEGER NOT NULL,
      note_title TEXT,
      note TEXT,
      tags_json TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      id_tag_group INTEGER,
      icon TEXT,
      order_index INTEGER DEFAULT 0,
      state INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (id_tag_group) REFERENCES tag_groups(id)
    );

    CREATE TABLE IF NOT EXISTS tag_groups (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS moods (
      id INTEGER PRIMARY KEY,
      custom_name TEXT NOT NULL,
      mood_group_id INTEGER NOT NULL,
      icon_id INTEGER,
      predefined_name_id INTEGER,
      state INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entries_datetime ON entries(datetime DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(year, month, day);
    CREATE INDEX IF NOT EXISTS idx_entries_mood ON entries(mood);
    CREATE INDEX IF NOT EXISTS idx_tags_group ON tags(id_tag_group);
    CREATE INDEX IF NOT EXISTS idx_moods_group ON moods(mood_group_id);
  `)
}

function getMigrationVersion(db) {
  try {
    const row = db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get()
    return row ? row.version : 0
  } catch (err) {
    return 0
  }
}

function setMigrationVersion(db, version) {
  db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(version)
}

module.exports = {
  createSchema,
  getMigrationVersion,
  setMigrationVersion
}
