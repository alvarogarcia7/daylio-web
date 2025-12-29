const { getDatabase } = require('./database')

function createEntry({ minute, hour, day, month, year, datetime, timeZoneOffset, mood, noteTitle = '', note = '', tags = [] }) {
  const db = getDatabase()
  
  try {
    const stmt = db.prepare(`
      INSERT INTO entries (
        minute, hour, day, month, year, datetime, time_zone_offset,
        mood, note_title, note, tags_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      minute,
      hour,
      day,
      month,
      year,
      datetime,
      timeZoneOffset,
      mood,
      noteTitle,
      note,
      JSON.stringify(tags)
    )
    
    return {
      success: true,
      id: result.lastInsertRowid
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

function getAllEntries() {
  const db = getDatabase()
  
  try {
    const stmt = db.prepare('SELECT * FROM entries ORDER BY datetime DESC')
    const entries = stmt.all()
    
    return {
      success: true,
      data: entries.map(entry => ({
        id: entry.id,
        minute: entry.minute,
        hour: entry.hour,
        day: entry.day,
        month: entry.month,
        year: entry.year,
        datetime: entry.datetime,
        timeZoneOffset: entry.time_zone_offset,
        mood: entry.mood,
        noteTitle: entry.note_title,
        note: entry.note,
        tags: JSON.parse(entry.tags_json),
        createdAt: entry.created_at
      }))
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

function getAvailableMoods() {
  const db = getDatabase()
  
  try {
    const stmt = db.prepare('SELECT * FROM moods ORDER BY mood_group_id')
    const moods = stmt.all()
    
    return {
      success: true,
      data: moods.map(mood => ({
        id: mood.id,
        customName: mood.custom_name,
        moodGroupId: mood.mood_group_id,
        iconId: mood.icon_id,
        predefinedNameId: mood.predefined_name_id,
        state: mood.state,
        createdAt: mood.created_at
      }))
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

function getAvailableTags() {
  const db = getDatabase()
  
  try {
    const tagsStmt = db.prepare('SELECT * FROM tags ORDER BY order_index')
    const tags = tagsStmt.all()
    
    const tagGroupsStmt = db.prepare('SELECT * FROM tag_groups ORDER BY order_index')
    const tagGroups = tagGroupsStmt.all()
    
    return {
      success: true,
      data: {
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          idTagGroup: tag.id_tag_group,
          icon: tag.icon,
          orderIndex: tag.order_index,
          state: tag.state,
          createdAt: tag.created_at
        })),
        tagGroups: tagGroups.map(group => ({
          id: group.id,
          name: group.name,
          orderIndex: group.order_index
        }))
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

function getMetadata() {
  const db = getDatabase()
  
  try {
    const entryCountStmt = db.prepare('SELECT COUNT(*) as count FROM entries')
    const entryCount = entryCountStmt.get()
    
    const moodCountStmt = db.prepare('SELECT COUNT(*) as count FROM moods')
    const moodCount = moodCountStmt.get()
    
    const tagCountStmt = db.prepare('SELECT COUNT(*) as count FROM tags')
    const tagCount = tagCountStmt.get()
    
    const oldestEntryStmt = db.prepare('SELECT MIN(datetime) as oldest FROM entries')
    const oldestEntry = oldestEntryStmt.get()
    
    const newestEntryStmt = db.prepare('SELECT MAX(datetime) as newest FROM entries')
    const newestEntry = newestEntryStmt.get()
    
    return {
      success: true,
      data: {
        numberOfEntries: entryCount.count,
        numberOfMoods: moodCount.count,
        numberOfTags: tagCount.count,
        oldestEntry: oldestEntry.oldest,
        newestEntry: newestEntry.newest
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

module.exports = {
  createEntry,
  getAllEntries,
  getAvailableMoods,
  getAvailableTags,
  getMetadata
}
