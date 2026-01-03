const Database = require('better-sqlite3')
const { createSchema } = require('../../db/migrations')
const {
  createEntry,
  getAllEntries,
  getAvailableMoods,
  getAvailableTags,
  getMetadata
} = require('../../db/repository')

let originalDb
let db
let originalGetDatabase

beforeEach(() => {
  originalDb = global.db
  db = new Database(':memory:')
  createSchema(db)
  
  const databaseModule = require('../../db/database')
  originalGetDatabase = databaseModule.getDatabase
  databaseModule.getDatabase = jest.fn(() => db)
  global.db = db

  const result = getMetadata()
  
  expect(result.success).toBe(true)
  expect(result.data.numberOfEntries).toBe(0)
})

afterEach(() => {
  if (db) {
    db.close()
  }
  
  const databaseModule = require('../../db/database')
  databaseModule.getDatabase = originalGetDatabase
  global.db = originalDb
})

describe('createEntry', () => {
  test('should successfully create an entry with all required fields', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3
    }
    
    const result = createEntry(entryData)
    
    expect(result.success).toBe(true)
    expect(result.id).toBeDefined()
    expect(typeof result.id).toBe('number')
  })
  
  test('should create entry with optional fields', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3,
      noteTitle: 'Test Title',
      note: 'Test note content',
      tags: [1, 2, 3]
    }
    
    const result = createEntry(entryData)
    
    expect(result.success).toBe(true)
    expect(result.id).toBeDefined()
    
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.id)
    expect(entry.note_title).toBe('Test Title')
    expect(entry.note).toBe('Test note content')
    expect(JSON.parse(entry.tags_json)).toEqual([1, 2, 3])
  })
  
  test('should default noteTitle and note to empty string', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3
    }
    
    const result = createEntry(entryData)
    
    expect(result.success).toBe(true)
    
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.id)
    expect(entry.note_title).toBe('')
    expect(entry.note).toBe('')
  })
  
  test('should default tags to empty array', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3
    }
    
    const result = createEntry(entryData)
    
    expect(result.success).toBe(true)
    
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.id)
    expect(JSON.parse(entry.tags_json)).toEqual([])
  })
  
  test('should return error when missing required field', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023
    }
    
    const result = createEntry(entryData)
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })
  
  test('should create even with invalid data types', () => {
    const entryData = {
      minute: 'invalid',
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3
    }
    
    const result = createEntry(entryData)
    
    expect(result.success).toBe(true)
    expect(result.error).not.toBeDefined()
  })
  
  test('should handle database constraint violations', () => {
    const entryData = {
      minute: null,
      hour: null,
      day: null,
      month: null,
      year: null,
      datetime: null,
      timeZoneOffset: null,
      mood: null
    }
    
    const result = createEntry(entryData)
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  test('should create multiple entries successfully', () => {
    const entry1 = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3
    }
    
    const entry2 = {
      minute: 45,
      hour: 16,
      day: 16,
      month: 6,
      year: 2023,
      datetime: 1686930600000,
      timeZoneOffset: -240,
      mood: 4
    }
    
    const result1 = createEntry(entry1)
    const result2 = createEntry(entry2)
    
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
    expect(result1.id).not.toBe(result2.id)
  })
  
  test('should properly serialize tags as JSON', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3,
      tags: [5, 10, 15, 20]
    }
    
    const result = createEntry(entryData)
    
    expect(result.success).toBe(true)
    
    const entry = db.prepare('SELECT tags_json FROM entries WHERE id = ?').get(result.id)
    const parsedTags = JSON.parse(entry.tags_json)
    expect(parsedTags).toEqual([5, 10, 15, 20])
  })
})

describe('getAllEntries', () => {
  test('should return empty array when no entries exist', () => {
    const result = getAllEntries()
    
    expect(result.success).toBe(true)
    expect(result.data).toEqual([])
  })
  
  test('should retrieve a single entry', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3,
      noteTitle: 'Test',
      note: 'Content',
      tags: [1, 2]
    }
    
    const createResult = createEntry(entryData)
    expect(createResult.success).toBe(true)
    
    const result = getAllEntries()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(createResult.id)
    expect(result.data[0].minute).toBe(30)
    expect(result.data[0].hour).toBe(14)
    expect(result.data[0].day).toBe(15)
    expect(result.data[0].month).toBe(6)
    expect(result.data[0].year).toBe(2023)
    expect(result.data[0].datetime).toBe(1686844200000)
    expect(result.data[0].timeZoneOffset).toBe(-240)
    expect(result.data[0].mood).toBe(3)
    expect(result.data[0].noteTitle).toBe('Test')
    expect(result.data[0].note).toBe('Content')
    expect(result.data[0].tags).toEqual([1, 2])
    expect(result.data[0].createdAt).toBeDefined()
  })
  
  test('should retrieve multiple entries', () => {
    const entries = [
      {
        minute: 30,
        hour: 14,
        day: 15,
        month: 6,
        year: 2023,
        datetime: 1686844200000,
        timeZoneOffset: -240,
        mood: 3
      },
      {
        minute: 45,
        hour: 16,
        day: 16,
        month: 6,
        year: 2023,
        datetime: 1686930600000,
        timeZoneOffset: -240,
        mood: 4
      },
      {
        minute: 0,
        hour: 10,
        day: 17,
        month: 6,
        year: 2023,
        datetime: 1687003200000,
        timeZoneOffset: -240,
        mood: 5
      }
    ]
    
    entries.forEach(entry => {
      const result = createEntry(entry)
      expect(result.success).toBe(true)
    })
    
    const result = getAllEntries()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
  })
  
  test('should return entries ordered by datetime DESC', () => {
    const entry1 = {
      minute: 0,
      hour: 10,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686830400000,
      timeZoneOffset: -240,
      mood: 3
    }
    
    const entry2 = {
      minute: 0,
      hour: 10,
      day: 17,
      month: 6,
      year: 2023,
      datetime: 1687003200000,
      timeZoneOffset: -240,
      mood: 5
    }
    
    const entry3 = {
      minute: 0,
      hour: 10,
      day: 16,
      month: 6,
      year: 2023,
      datetime: 1686916800000,
      timeZoneOffset: -240,
      mood: 4
    }
    
    createEntry(entry1)
    createEntry(entry2)
    createEntry(entry3)
    
    const result = getAllEntries()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
    expect(result.data[0].datetime).toBe(1687003200000)
    expect(result.data[1].datetime).toBe(1686916800000)
    expect(result.data[2].datetime).toBe(1686830400000)
  })
  
  test('should properly parse tags JSON', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3,
      tags: [100, 200, 300]
    }
    
    createEntry(entryData)
    
    const result = getAllEntries()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(Array.isArray(result.data[0].tags)).toBe(true)
    expect(result.data[0].tags).toEqual([100, 200, 300])
  })
  
  test('should handle empty tags array', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3,
      tags: []
    }
    
    createEntry(entryData)
    
    const result = getAllEntries()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].tags).toEqual([])
  })
  
  test('should handle database errors gracefully', () => {
    db.close()
    
    const result = getAllEntries()
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })
  
  test('should map database fields to camelCase', () => {
    const entryData = {
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3,
      noteTitle: 'Title',
      note: 'Note'
    }
    
    createEntry(entryData)
    
    const result = getAllEntries()
    
    expect(result.success).toBe(true)
    expect(result.data[0]).toHaveProperty('timeZoneOffset')
    expect(result.data[0]).toHaveProperty('noteTitle')
    expect(result.data[0]).toHaveProperty('createdAt')
    expect(result.data[0]).not.toHaveProperty('time_zone_offset')
    expect(result.data[0]).not.toHaveProperty('note_title')
    expect(result.data[0]).not.toHaveProperty('created_at')
  })
})

describe('getAvailableMoods', () => {
  test('should return empty array when no moods exist', () => {
    const result = getAvailableMoods()
    
    expect(result.success).toBe(true)
    expect(result.data).toEqual([])
  })
  
  test('should retrieve a single mood', () => {
    db.prepare(`
      INSERT INTO moods (id, custom_name, mood_group_id, icon_id, predefined_name_id, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'happy', 5, 10, 1, 0, 1686844200000)
    
    const result = getAvailableMoods()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].customName).toBe('happy')
    expect(result.data[0].moodGroupId).toBe(5)
    expect(result.data[0].iconId).toBe(10)
    expect(result.data[0].predefinedNameId).toBe(1)
    expect(result.data[0].state).toBe(0)
    expect(result.data[0].createdAt).toBe(1686844200000)
  })
  
  test('should retrieve multiple moods', () => {
    const moods = [
      [1, 'happy', 5, 10, 1, 0, 1686844200000],
      [2, 'sad', 2, 20, 2, 0, 1686844300000],
      [3, 'excited', 4, 30, 3, 0, 1686844400000]
    ]
    
    const stmt = db.prepare(`
      INSERT INTO moods (id, custom_name, mood_group_id, icon_id, predefined_name_id, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    moods.forEach(mood => stmt.run(...mood))
    
    const result = getAvailableMoods()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
  })
  
  test('should return moods ordered by mood_group_id', () => {
    const moods = [
      [1, 'happy', 5, 10, 1, 0, 1686844200000],
      [2, 'sad', 2, 20, 2, 0, 1686844300000],
      [3, 'excited', 4, 30, 3, 0, 1686844400000]
    ]
    
    const stmt = db.prepare(`
      INSERT INTO moods (id, custom_name, mood_group_id, icon_id, predefined_name_id, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    moods.forEach(mood => stmt.run(...mood))
    
    const result = getAvailableMoods()
    
    expect(result.success).toBe(true)
    expect(result.data[0].moodGroupId).toBe(2)
    expect(result.data[1].moodGroupId).toBe(4)
    expect(result.data[2].moodGroupId).toBe(5)
  })
  
  test('should handle null icon_id and predefined_name_id', () => {
    db.prepare(`
      INSERT INTO moods (id, custom_name, mood_group_id, icon_id, predefined_name_id, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'custom', 3, null, null, 0, 1686844200000)
    
    const result = getAvailableMoods()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].iconId).toBeNull()
    expect(result.data[0].predefinedNameId).toBeNull()
  })
  
  test('should map database fields to camelCase', () => {
    db.prepare(`
      INSERT INTO moods (id, custom_name, mood_group_id, icon_id, predefined_name_id, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'happy', 5, 10, 1, 0, 1686844200000)
    
    const result = getAvailableMoods()
    
    expect(result.success).toBe(true)
    expect(result.data[0]).toHaveProperty('customName')
    expect(result.data[0]).toHaveProperty('moodGroupId')
    expect(result.data[0]).toHaveProperty('iconId')
    expect(result.data[0]).toHaveProperty('predefinedNameId')
    expect(result.data[0]).toHaveProperty('createdAt')
    expect(result.data[0]).not.toHaveProperty('custom_name')
    expect(result.data[0]).not.toHaveProperty('mood_group_id')
  })
  
  test('should handle database errors gracefully', () => {
    db.close()
    
    const result = getAvailableMoods()
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })
})

describe('getAvailableTags', () => {
  test('should return empty arrays when no tags or tag groups exist', () => {
    const result = getAvailableTags()
    
    expect(result.success).toBe(true)
    expect(result.data.tags).toEqual([])
    expect(result.data.tagGroups).toEqual([])
  })
  
  test('should retrieve tags and tag groups', () => {
    db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `).run(1, 'Activities', 0)
    
    db.prepare(`
      INSERT INTO tags (id, name, id_tag_group, icon, order_index, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'work', 1, 'work_icon', 0, 0, 1686844200000)
    
    const result = getAvailableTags()
    
    expect(result.success).toBe(true)
    expect(result.data.tags).toHaveLength(1)
    expect(result.data.tagGroups).toHaveLength(1)
  })
  
  test('should retrieve multiple tags with proper structure', () => {
    db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `).run(1, 'Activities', 0)
    
    const tags = [
      [1, 'work', 1, 'work_icon', 0, 0, 1686844200000],
      [2, 'exercise', 1, 'exercise_icon', 1, 0, 1686844300000],
      [3, 'reading', 1, 'reading_icon', 2, 0, 1686844400000]
    ]
    
    const stmt = db.prepare(`
      INSERT INTO tags (id, name, id_tag_group, icon, order_index, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    tags.forEach(tag => stmt.run(...tag))
    
    const result = getAvailableTags()
    
    expect(result.success).toBe(true)
    expect(result.data.tags).toHaveLength(3)
    expect(result.data.tags[0].name).toBe('work')
    expect(result.data.tags[0].idTagGroup).toBe(1)
    expect(result.data.tags[0].icon).toBe('work_icon')
    expect(result.data.tags[0].orderIndex).toBe(0)
    expect(result.data.tags[0].state).toBe(0)
    expect(result.data.tags[0].createdAt).toBe(1686844200000)
  })
  
  test('should retrieve multiple tag groups', () => {
    const tagGroups = [
      [1, 'Activities', 0],
      [2, 'People', 1],
      [3, 'Places', 2]
    ]
    
    const stmt = db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `)
    
    tagGroups.forEach(group => stmt.run(...group))
    
    const result = getAvailableTags()
    
    expect(result.success).toBe(true)
    expect(result.data.tagGroups).toHaveLength(3)
    expect(result.data.tagGroups[0].name).toBe('Activities')
    expect(result.data.tagGroups[0].orderIndex).toBe(0)
  })
  
  test('should return tags ordered by order_index', () => {
    db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `).run(1, 'Activities', 0)
    
    const tags = [
      [1, 'work', 1, 'work_icon', 2, 0, 1686844200000],
      [2, 'exercise', 1, 'exercise_icon', 0, 0, 1686844300000],
      [3, 'reading', 1, 'reading_icon', 1, 0, 1686844400000]
    ]
    
    const stmt = db.prepare(`
      INSERT INTO tags (id, name, id_tag_group, icon, order_index, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    tags.forEach(tag => stmt.run(...tag))
    
    const result = getAvailableTags()
    
    expect(result.success).toBe(true)
    expect(result.data.tags[0].orderIndex).toBe(0)
    expect(result.data.tags[1].orderIndex).toBe(1)
    expect(result.data.tags[2].orderIndex).toBe(2)
  })
  
  test('should return tag groups ordered by order_index', () => {
    const tagGroups = [
      [1, 'Activities', 2],
      [2, 'People', 0],
      [3, 'Places', 1]
    ]
    
    const stmt = db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `)
    
    tagGroups.forEach(group => stmt.run(...group))
    
    const result = getAvailableTags()
    
    expect(result.success).toBe(true)
    expect(result.data.tagGroups[0].orderIndex).toBe(0)
    expect(result.data.tagGroups[1].orderIndex).toBe(1)
    expect(result.data.tagGroups[2].orderIndex).toBe(2)
  })
  
  test('should map database fields to camelCase', () => {
    db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `).run(1, 'Activities', 0)
    
    db.prepare(`
      INSERT INTO tags (id, name, id_tag_group, icon, order_index, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'work', 1, 'work_icon', 0, 0, 1686844200000)
    
    const result = getAvailableTags()
    
    expect(result.success).toBe(true)
    expect(result.data.tags[0]).toHaveProperty('idTagGroup')
    expect(result.data.tags[0]).toHaveProperty('orderIndex')
    expect(result.data.tags[0]).toHaveProperty('createdAt')
    expect(result.data.tagGroups[0]).toHaveProperty('orderIndex')
    expect(result.data.tags[0]).not.toHaveProperty('id_tag_group')
    expect(result.data.tags[0]).not.toHaveProperty('order_index')
  })
  
  test('should handle database errors gracefully', () => {
    db.close()
    
    const result = getAvailableTags()
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })
  
  test('should handle null icon in tags', () => {
    db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `).run(1, 'Activities', 0)
    
    db.prepare(`
      INSERT INTO tags (id, name, id_tag_group, icon, order_index, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'work', 1, null, 0, 0, 1686844200000)
    
    const result = getAvailableTags()
    
    expect(result.success).toBe(true)
    expect(result.data.tags[0].icon).toBeNull()
  })
})

describe('getMetadata', () => {
  test('should return zero counts when database is empty', () => {
    const result = getMetadata()
    
    expect(result.success).toBe(true)
    expect(result.data.numberOfEntries).toBe(0)
    expect(result.data.numberOfMoods).toBe(0)
    expect(result.data.numberOfTags).toBe(0)
    expect(result.data.oldestEntry).toBeNull()
    expect(result.data.newestEntry).toBeNull()
  })
  
  test('should count entries correctly', () => {
    const entries = [
      {
        minute: 30,
        hour: 14,
        day: 15,
        month: 6,
        year: 2023,
        datetime: 1686844200000,
        timeZoneOffset: -240,
        mood: 3
      },
      {
        minute: 45,
        hour: 16,
        day: 16,
        month: 6,
        year: 2023,
        datetime: 1686930600000,
        timeZoneOffset: -240,
        mood: 4
      }
    ]
    
    entries.forEach(entry => createEntry(entry))
    
    const result = getMetadata()
    
    expect(result.success).toBe(true)
    expect(result.data.numberOfEntries).toBe(2)
  })
  
  test('should count moods correctly', () => {
    const moods = [
      [1, 'happy', 5, 10, 1, 0, 1686844200000],
      [2, 'sad', 2, 20, 2, 0, 1686844300000],
      [3, 'excited', 4, 30, 3, 0, 1686844400000]
    ]
    
    const stmt = db.prepare(`
      INSERT INTO moods (id, custom_name, mood_group_id, icon_id, predefined_name_id, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    moods.forEach(mood => stmt.run(...mood))
    
    const result = getMetadata()
    
    expect(result.success).toBe(true)
    expect(result.data.numberOfMoods).toBe(3)
  })
  
  test('should count tags correctly', () => {
    db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `).run(1, 'Activities', 0)
    
    const tags = [
      [1, 'work', 1, 'work_icon', 0, 0, 1686844200000],
      [2, 'exercise', 1, 'exercise_icon', 1, 0, 1686844300000],
      [3, 'reading', 1, 'reading_icon', 2, 0, 1686844400000],
      [4, 'gaming', 1, 'gaming_icon', 3, 0, 1686844500000]
    ]
    
    const stmt = db.prepare(`
      INSERT INTO tags (id, name, id_tag_group, icon, order_index, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    tags.forEach(tag => stmt.run(...tag))
    
    const result = getMetadata()
    
    expect(result.success).toBe(true)
    expect(result.data.numberOfTags).toBe(4)
  })
  
  test('should identify oldest entry correctly', () => {
    const entries = [
      {
        minute: 0,
        hour: 10,
        day: 15,
        month: 6,
        year: 2023,
        datetime: 1686830400000,
        timeZoneOffset: -240,
        mood: 3
      },
      {
        minute: 0,
        hour: 10,
        day: 17,
        month: 6,
        year: 2023,
        datetime: 1687003200000,
        timeZoneOffset: -240,
        mood: 5
      },
      {
        minute: 0,
        hour: 10,
        day: 16,
        month: 6,
        year: 2023,
        datetime: 1686916800000,
        timeZoneOffset: -240,
        mood: 4
      }
    ]
    
    entries.forEach(entry => createEntry(entry))
    
    const result = getMetadata()
    
    expect(result.success).toBe(true)
    expect(result.data.oldestEntry).toBe(1686830400000)
  })
  
  test('should identify newest entry correctly', () => {
    const entries = [
      {
        minute: 0,
        hour: 10,
        day: 15,
        month: 6,
        year: 2023,
        datetime: 1686830400000,
        timeZoneOffset: -240,
        mood: 3
      },
      {
        minute: 0,
        hour: 10,
        day: 17,
        month: 6,
        year: 2023,
        datetime: 1687003200000,
        timeZoneOffset: -240,
        mood: 5
      },
      {
        minute: 0,
        hour: 10,
        day: 16,
        month: 6,
        year: 2023,
        datetime: 1686916800000,
        timeZoneOffset: -240,
        mood: 4
      }
    ]
    
    entries.forEach(entry => createEntry(entry))
    
    const result = getMetadata()
    
    expect(result.success).toBe(true)
    expect(result.data.newestEntry).toBe(1687003200000)
  })
  
  test('should return complete metadata structure', () => {
    createEntry({
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3
    })
    
    db.prepare(`
      INSERT INTO moods (id, custom_name, mood_group_id, icon_id, predefined_name_id, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'happy', 5, 10, 1, 0, 1686844200000)
    
    db.prepare(`
      INSERT INTO tag_groups (id, name, order_index)
      VALUES (?, ?, ?)
    `).run(1, 'Activities', 0)
    
    db.prepare(`
      INSERT INTO tags (id, name, id_tag_group, icon, order_index, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'work', 1, 'work_icon', 0, 0, 1686844200000)
    
    const result = getMetadata()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('numberOfEntries')
    expect(result.data).toHaveProperty('numberOfMoods')
    expect(result.data).toHaveProperty('numberOfTags')
    expect(result.data).toHaveProperty('oldestEntry')
    expect(result.data).toHaveProperty('newestEntry')
    expect(result.data.numberOfEntries).toBe(1)
    expect(result.data.numberOfMoods).toBe(1)
    expect(result.data.numberOfTags).toBe(1)
  })
  
  test('should handle database errors gracefully', () => {
    db.close()
    
    const result = getMetadata()
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })
  
  test('should handle single entry for oldest and newest', () => {
    createEntry({
      minute: 30,
      hour: 14,
      day: 15,
      month: 6,
      year: 2023,
      datetime: 1686844200000,
      timeZoneOffset: -240,
      mood: 3
    })
    
    const result = getMetadata()
    
    expect(result.success).toBe(true)
    expect(result.data.oldestEntry).toBe(1686844200000)
    expect(result.data.newestEntry).toBe(1686844200000)
  })
})
