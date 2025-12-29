const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const TEST_DB_DIR = path.join(__dirname, '../data/test');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test_daylio.db');

global.testDbPath = TEST_DB_PATH;
global.testDbDir = TEST_DB_DIR;

beforeAll(() => {
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  }
});

beforeEach(() => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

afterEach(() => {
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (err) {
      console.warn('Failed to cleanup test database:', err.message);
    }
  }
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_DIR)) {
    try {
      const files = fs.readdirSync(TEST_DB_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(TEST_DB_DIR, file));
      });
      fs.rmdirSync(TEST_DB_DIR);
    } catch (err) {
      console.warn('Failed to cleanup test directory:', err.message);
    }
  }
});

global.createTestDb = () => {
  const db = new Database(TEST_DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS day_entries (
      id INTEGER PRIMARY KEY,
      year INTEGER,
      month INTEGER,
      day INTEGER,
      weekday INTEGER,
      datetime TEXT,
      date_only TEXT,
      mood TEXT,
      note TEXT,
      note_title TEXT
    );
    
    CREATE TABLE IF NOT EXISTS day_tags (
      day_id INTEGER,
      tag_id INTEGER,
      FOREIGN KEY (day_id) REFERENCES day_entries(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    );
    
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE,
      icon TEXT,
      created_at TEXT,
      state INTEGER
    );
  `);
  
  return db;
};

global.closeTestDb = (db) => {
  if (db) {
    db.close();
  }
};
