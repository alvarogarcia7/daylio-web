const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const { createSchema, getMigrationVersion, setMigrationVersion } = require('./migrations')

const DB_PATH = path.join(__dirname, '..', 'data', 'daylio.db')

global.db = null

function initializeDatabase() {
  const dataDir = path.join(__dirname, '..', 'data')
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  global.db = new Database(DB_PATH)
  global.db.pragma('journal_mode = WAL')
  
  runMigrations()
  
  return global.db
}

function runMigrations() {
  const currentVersion = getMigrationVersion(global.db)
  
  if (currentVersion === 0) {
    console.log('info: running database migrations')
    createSchema(global.db)
    setMigrationVersion(global.db, 1)
    console.log('info: migrations complete')
  }
}

function getDatabase() {
  if (!global.db) {
    global.db = initializeDatabase()
  }
  return global.db
}

function closeDatabase() {
  if (global.db) {
    global.db.close()
    global.db = null
  }
}

function importDaylioData(rawData) {
  const db = getDatabase()
  
  console.log('info: importing data into database')
  
  const importTransaction = db.transaction(() => {
    db.prepare('DELETE FROM entries').run()
    db.prepare('DELETE FROM tags').run()
    db.prepare('DELETE FROM tag_groups').run()
    db.prepare('DELETE FROM moods').run()
    
    const insertTagGroup = db.prepare(`
      INSERT OR REPLACE INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `)
    
    for (let i = 0; i < rawData.tag_groups.length; i++) {
      const group = rawData.tag_groups[i]
      insertTagGroup.run(group.id, group.name, group.order || i)
    }
    
    const insertTag = db.prepare(`
      INSERT OR REPLACE INTO tags (id, name, id_tag_group, icon, order_index, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (let i = 0; i < rawData.tags.length; i++) {
      const tag = rawData.tags[i]
      insertTag.run(
        tag.id,
        tag.name,
        tag.id_tag_group,
        tag.icon,
        tag.order || i,
        tag.state || 0,
        tag.createdAt || Date.now()
      )
    }
    
    const insertMood = db.prepare(`
      INSERT OR REPLACE INTO moods (id, custom_name, mood_group_id, icon_id, predefined_name_id, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (let i = 0; i < rawData.customMoods.length; i++) {
      const mood = rawData.customMoods[i]
      insertMood.run(
        mood.id,
        mood.custom_name,
        mood.mood_group_id,
        mood.icon_id || null,
        mood.predefined_name_id || null,
        mood.state || 0,
        mood.createdAt || Date.now()
      )
    }
    
    const insertEntry = db.prepare(`
      INSERT OR REPLACE INTO entries (
        id, minute, hour, day, month, year, datetime, time_zone_offset,
        mood, note_title, note, tags_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const entry of rawData.dayEntries) {
      insertEntry.run(
        entry.id,
        entry.minute,
        entry.hour,
        entry.day,
        entry.month,
        entry.year,
        entry.datetime,
        entry.timeZoneOffset,
        entry.mood,
        entry.note_title || '',
        entry.note || '',
        JSON.stringify(entry.tags || [])
      )
    }
  })
  
  importTransaction()
  console.log('info: data import complete')
}

function loadDataFromDatabase() {
  const db = getDatabase()
  
  const entries = db.prepare('SELECT * FROM entries ORDER BY datetime DESC').all()
  const tags = db.prepare('SELECT * FROM tags ORDER BY order_index').all()
  const tagGroups = db.prepare('SELECT * FROM tag_groups ORDER BY order_index').all()
  const moods = db.prepare('SELECT * FROM moods ORDER BY mood_group_id').all()
  
  const dayEntries = entries.map(entry => ({
    id: entry.id,
    minute: entry.minute,
    hour: entry.hour,
    day: entry.day,
    month: entry.month,
    year: entry.year,
    datetime: entry.datetime,
    timeZoneOffset: entry.time_zone_offset,
    mood: entry.mood,
    note_title: entry.note_title,
    note: entry.note,
    tags: JSON.parse(entry.tags_json)
  }))
  
  const tagsArray = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    id_tag_group: tag.id_tag_group,
    icon: tag.icon,
    order: tag.order_index,
    state: tag.state,
    createdAt: tag.created_at
  }))
  
  const tagGroupsArray = tagGroups.map(group => ({
    id: group.id,
    name: group.name,
    order: group.order_index
  }))
  
  const customMoods = moods.map(mood => ({
    id: mood.id,
    custom_name: mood.custom_name,
    mood_group_id: mood.mood_group_id,
    icon_id: mood.icon_id,
    predefined_name_id: mood.predefined_name_id,
    state: mood.state,
    createdAt: mood.created_at
  }))
  
  return {
    dayEntries: dayEntries,
    tags: tagsArray,
    tag_groups: tagGroupsArray,
    customMoods: customMoods,
    metadata: {
      number_of_entries: entries.length
    },
    daysInRowLongestChain: 0
  }
}

function isDatabasePopulated() {
  const db = getDatabase()
  
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM entries').get()
    return result.count > 0
  } catch (err) {
    return false
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  importDaylioData,
  loadDataFromDatabase,
  isDatabasePopulated
}
