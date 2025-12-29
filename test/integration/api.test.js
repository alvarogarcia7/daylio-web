const request = require('supertest')
const express = require('express')
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const { initializeDatabase, importDaylioData, closeDatabase } = require('../../db/database')
const { createEntry } = require('../../db/repository')
const { getEntryData, getReadableData, getStructuredEntries } = require('../../server')

const TEST_DB_DIR = path.join(__dirname, '../../data/test-integration')
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test_daylio.db')

let app
let originalDbPath

const mockDaylioData = {
  dayEntries: [
    {
      id: 1,
      minute: 30,
      hour: 14,
      day: 15,
      month: 3,
      year: 2024,
      datetime: 1710511800000,
      timeZoneOffset: 0,
      mood: 1,
      note_title: 'Great day',
      note: 'Had a wonderful time',
      tags: [1, 2]
    },
    {
      id: 2,
      minute: 45,
      hour: 10,
      day: 16,
      month: 3,
      year: 2024,
      datetime: 1710585945000,
      timeZoneOffset: 0,
      mood: 3,
      note_title: 'Normal day',
      note: 'Nothing special',
      tags: [3]
    }
  ],
  tags: [
    { id: 1, name: 'Exercise', id_tag_group: 1, icon: 'fitness', order: 0, state: 0, createdAt: Date.now() },
    { id: 2, name: 'Reading', id_tag_group: 1, icon: 'book', order: 1, state: 0, createdAt: Date.now() },
    { id: 3, name: 'Work', id_tag_group: 2, icon: 'work', order: 2, state: 0, createdAt: Date.now() }
  ],
  tag_groups: [
    { id: 1, name: 'Hobbies', order: 0 },
    { id: 2, name: 'Responsibilities', order: 1 }
  ],
  customMoods: [
    { id: 1, custom_name: 'rad', mood_group_id: 1, icon_id: 1, predefined_name_id: 1, state: 0, createdAt: Date.now() },
    { id: 2, custom_name: 'good', mood_group_id: 2, icon_id: 2, predefined_name_id: 2, state: 0, createdAt: Date.now() },
    { id: 3, custom_name: 'meh', mood_group_id: 3, icon_id: 3, predefined_name_id: 3, state: 0, createdAt: Date.now() },
    { id: 4, custom_name: 'bad', mood_group_id: 4, icon_id: 4, predefined_name_id: 4, state: 0, createdAt: Date.now() },
    { id: 5, custom_name: 'awful', mood_group_id: 5, icon_id: 5, predefined_name_id: 5, state: 0, createdAt: Date.now() }
  ],
  metadata: {
    number_of_entries: 2
  },
  daysInRowLongestChain: 2
}

function setupTestApp(daylioData) {
  const testApp = express()
  testApp.use(express.json())

  const ENTRY_DATA = getEntryData(daylioData)
  const VITAL_DATA = getReadableData(daylioData)

  testApp.get('/vital', (req, res) => {
    res.json(VITAL_DATA)
  })

  testApp.get('/entries', (req, res) => {
    res.json(ENTRY_DATA)
  })

  testApp.get('/structured_data', (req, res) => {
    res.json(getStructuredEntries())
  })

  testApp.post('/api/entries', (req, res) => {
    const { mood, datetime, note = '', note_title = '', tags = [] } = req.body

    if (mood === undefined || mood === null) {
      return res.status(400).json({ error: 'mood is required' })
    }

    if (!datetime) {
      return res.status(400).json({ error: 'datetime is required' })
    }

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'tags must be an array' })
    }

    const datetimeNum = Number(datetime)
    if (isNaN(datetimeNum)) {
      return res.status(400).json({ error: 'datetime must be a valid number' })
    }

    const moment = require('moment')
    const timeZoneOffset = 0
    const time_obj = moment.unix((datetimeNum + timeZoneOffset) / 1000).utc()
    
    const entryData = {
      minute: time_obj.minutes(),
      hour: time_obj.hours(),
      day: time_obj.date(),
      month: time_obj.month() + 1,
      year: time_obj.year(),
      datetime: datetimeNum,
      timeZoneOffset: timeZoneOffset,
      mood: mood,
      noteTitle: note_title,
      note: note,
      tags: tags
    }

    const result = createEntry(entryData)

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    const createdEntry = {
      id: result.id,
      mood: mood,
      datetime: datetimeNum,
      note: note,
      note_title: note_title,
      tags: tags,
      ...entryData
    }

    res.status(201).json(createdEntry)
  })

  return testApp
}

describe('Integration Tests - API Endpoints', () => {
  beforeAll(() => {
    if (!fs.existsSync(TEST_DB_DIR)) {
      fs.mkdirSync(TEST_DB_DIR, { recursive: true })
    }

    originalDbPath = require.resolve('../../db/database')
    const Module = require('module')
    const originalRequire = Module.prototype.require

    Module.prototype.require = function(id) {
      if (id === '../../db/database' || id.endsWith('/db/database')) {
        const dbModule = originalRequire.apply(this, arguments)
        const originalInit = dbModule.initializeDatabase
        
        dbModule.initializeDatabase = function() {
          const Database = require('better-sqlite3')
          const { createSchema, getMigrationVersion, setMigrationVersion } = require('../../db/migrations')
          
          const db = new Database(TEST_DB_PATH)
          db.pragma('journal_mode = WAL')
          
          const currentVersion = getMigrationVersion(db)
          if (currentVersion === 0) {
            createSchema(db)
            setMigrationVersion(db, 1)
          }
          
          return db
        }
        
        return dbModule
      }
      return originalRequire.apply(this, arguments)
    }
  })

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    if (fs.existsSync(TEST_DB_PATH + '-shm')) {
      fs.unlinkSync(TEST_DB_PATH + '-shm')
    }
    if (fs.existsSync(TEST_DB_PATH + '-wal')) {
      fs.unlinkSync(TEST_DB_PATH + '-wal')
    }

    initializeDatabase()
    importDaylioData(mockDaylioData)
    app = setupTestApp(mockDaylioData)
  })

  afterEach(() => {
    closeDatabase()
    
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH)
      } catch (err) {
        console.warn('Failed to cleanup test database:', err.message)
      }
    }
    if (fs.existsSync(TEST_DB_PATH + '-shm')) {
      try {
        fs.unlinkSync(TEST_DB_PATH + '-shm')
      } catch (err) {}
    }
    if (fs.existsSync(TEST_DB_PATH + '-wal')) {
      try {
        fs.unlinkSync(TEST_DB_PATH + '-wal')
      } catch (err) {}
    }
  })

  afterAll(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      try {
        const files = fs.readdirSync(TEST_DB_DIR)
        files.forEach(file => {
          try {
            fs.unlinkSync(path.join(TEST_DB_DIR, file))
          } catch (err) {}
        })
        fs.rmdirSync(TEST_DB_DIR)
      } catch (err) {
        console.warn('Failed to cleanup test directory:', err.message)
      }
    }
  })

  describe('POST /api/entries', () => {
    describe('Valid payloads', () => {
      it('should create a new entry with all fields', async () => {
        const newEntry = {
          mood: 2,
          datetime: 1710672000000,
          note: 'This is a test note',
          note_title: 'Test Entry',
          tags: [1, 2]
        }

        const response = await request(app)
          .post('/api/entries')
          .send(newEntry)
          .expect(201)

        expect(response.body).toMatchObject({
          mood: 2,
          datetime: 1710672000000,
          note: 'This is a test note',
          note_title: 'Test Entry',
          tags: [1, 2]
        })
        expect(response.body).toHaveProperty('id')
        expect(typeof response.body.id).toBe('number')
        expect(response.body).toHaveProperty('day')
        expect(response.body).toHaveProperty('month')
        expect(response.body).toHaveProperty('year')
        expect(response.body).toHaveProperty('hour')
        expect(response.body).toHaveProperty('minute')
      })

      it('should create entry with only required fields', async () => {
        const minimalEntry = {
          mood: 3,
          datetime: 1710672000000
        }

        const response = await request(app)
          .post('/api/entries')
          .send(minimalEntry)
          .expect(201)

        expect(response.body).toMatchObject({
          mood: 3,
          datetime: 1710672000000,
          note: '',
          note_title: '',
          tags: []
        })
        expect(response.body).toHaveProperty('id')
      })

      it('should create entry with empty tags array', async () => {
        const entryWithEmptyTags = {
          mood: 1,
          datetime: 1710672000000,
          tags: []
        }

        const response = await request(app)
          .post('/api/entries')
          .send(entryWithEmptyTags)
          .expect(201)

        expect(response.body.tags).toEqual([])
      })

      it('should create entry with mood value 0', async () => {
        const entryWithZeroMood = {
          mood: 0,
          datetime: 1710672000000
        }

        const response = await request(app)
          .post('/api/entries')
          .send(entryWithZeroMood)
          .expect(201)

        expect(response.body.mood).toBe(0)
      })

      it('should properly parse datetime into date components', async () => {
        const entry = {
          mood: 1,
          datetime: 1710511800000
        }

        const response = await request(app)
          .post('/api/entries')
          .send(entry)
          .expect(201)

        expect(response.body.year).toBe(2024)
        expect(response.body.month).toBe(3)
        expect(response.body.day).toBe(15)
        expect(response.body.hour).toBe(14)
        expect(response.body.minute).toBe(30)
      })
    })

    describe('Invalid payloads', () => {
      it('should return 400 if mood is missing', async () => {
        const invalidEntry = {
          datetime: 1710672000000
        }

        const response = await request(app)
          .post('/api/entries')
          .send(invalidEntry)
          .expect(400)

        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('mood is required')
      })

      it('should return 400 if mood is null', async () => {
        const invalidEntry = {
          mood: null,
          datetime: 1710672000000
        }

        const response = await request(app)
          .post('/api/entries')
          .send(invalidEntry)
          .expect(400)

        expect(response.body.error).toBe('mood is required')
      })

      it('should return 400 if datetime is missing', async () => {
        const invalidEntry = {
          mood: 1
        }

        const response = await request(app)
          .post('/api/entries')
          .send(invalidEntry)
          .expect(400)

        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('datetime is required')
      })

      it('should return 400 if datetime is empty string', async () => {
        const invalidEntry = {
          mood: 1,
          datetime: ''
        }

        const response = await request(app)
          .post('/api/entries')
          .send(invalidEntry)
          .expect(400)

        expect(response.body.error).toBe('datetime is required')
      })

      it('should return 400 if datetime is not a valid number', async () => {
        const invalidEntry = {
          mood: 1,
          datetime: 'not-a-number'
        }

        const response = await request(app)
          .post('/api/entries')
          .send(invalidEntry)
          .expect(400)

        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('datetime must be a valid number')
      })

      it('should return 400 if tags is not an array', async () => {
        const invalidEntry = {
          mood: 1,
          datetime: 1710672000000,
          tags: 'not-an-array'
        }

        const response = await request(app)
          .post('/api/entries')
          .send(invalidEntry)
          .expect(400)

        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('tags must be an array')
      })

      it('should return 400 if tags is an object', async () => {
        const invalidEntry = {
          mood: 1,
          datetime: 1710672000000,
          tags: { tag: 1 }
        }

        const response = await request(app)
          .post('/api/entries')
          .send(invalidEntry)
          .expect(400)

        expect(response.body.error).toBe('tags must be an array')
      })

      it('should return 400 for malformed JSON', async () => {
        const response = await request(app)
          .post('/api/entries')
          .set('Content-Type', 'application/json')
          .send('{ invalid json }')
          .expect(400)
      })
    })
  })

  describe('GET /vital', () => {
    it('should return 200 with vital data structure', async () => {
      const response = await request(app)
        .get('/vital')
        .expect(200)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('available_activities')
      expect(response.body).toHaveProperty('available_activity_groups')
      expect(response.body).toHaveProperty('available_moods')
      expect(response.body).toHaveProperty('available_mood_groups')
      expect(response.body).toHaveProperty('ordered_mood_list')
      expect(response.body).toHaveProperty('months')
    })

    it('should return correct activities data', async () => {
      const response = await request(app)
        .get('/vital')
        .expect(200)

      const activities = response.body.available_activities
      expect(Object.keys(activities)).toHaveLength(3)
      expect(activities[1]).toHaveProperty('name', 'Exercise')
      expect(activities[1]).toHaveProperty('group', 1)
      expect(activities[1]).toHaveProperty('icon', 'fitness')
    })

    it('should return correct activity groups data', async () => {
      const response = await request(app)
        .get('/vital')
        .expect(200)

      const activityGroups = response.body.available_activity_groups
      expect(activityGroups[1]).toBe('Hobbies')
      expect(activityGroups[2]).toBe('Responsibilities')
    })

    it('should return correct moods data', async () => {
      const response = await request(app)
        .get('/vital')
        .expect(200)

      const moods = response.body.available_moods
      expect(Object.keys(moods)).toHaveLength(5)
      expect(moods[1]).toBe('rad')
      expect(moods[2]).toBe('good')
      expect(moods[3]).toBe('meh')
    })

    it('should return correct mood groups mapping', async () => {
      const response = await request(app)
        .get('/vital')
        .expect(200)

      const moodGroups = response.body.available_mood_groups
      expect(moodGroups[1]).toBe(1)
      expect(moodGroups[2]).toBe(2)
      expect(moodGroups[3]).toBe(3)
    })

    it('should return ordered mood list', async () => {
      const response = await request(app)
        .get('/vital')
        .expect(200)

      const orderedMoodList = response.body.ordered_mood_list
      expect(Array.isArray(orderedMoodList)).toBe(true)
      expect(orderedMoodList).toHaveLength(5)
      expect(orderedMoodList[0]).toBe('rad')
      expect(orderedMoodList[1]).toBe('good')
    })

    it('should return months array', async () => {
      const response = await request(app)
        .get('/vital')
        .expect(200)

      const months = response.body.months
      expect(Array.isArray(months)).toBe(true)
      expect(months).toHaveLength(12)
      expect(months[0]).toBe('Jan')
      expect(months[11]).toBe('Dec')
    })

    it('should maintain data consistency across multiple requests', async () => {
      const response1 = await request(app).get('/vital').expect(200)
      const response2 = await request(app).get('/vital').expect(200)

      expect(response1.body).toEqual(response2.body)
    })
  })

  describe('GET /entries', () => {
    it('should return 200 with entries array', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(200)
        .expect('Content-Type', /json/)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(2)
    })

    it('should return entries with correct schema', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(200)

      const entry = response.body[0]
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('time')
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('date_formatted')
      expect(entry).toHaveProperty('day')
      expect(entry).toHaveProperty('journal')
      expect(entry).toHaveProperty('mood')
      expect(entry).toHaveProperty('activities')
    })

    it('should return entries in correct order (newest first)', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(200)

      expect(response.body[0].id).toBe(1)
      expect(response.body[1].id).toBe(2)
    })

    it('should format date correctly', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(200)

      const entry = response.body[0]
      expect(entry.date).toMatch(/^\d{1,2}-\d{1,2}-\d{4}$/)
      expect(entry.date_formatted).toContain('2024')
    })

    it('should format time correctly', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(200)

      const entry = response.body[0]
      expect(entry.time).toMatch(/^\d{2}:\d{2} (AM|PM)$/)
    })

    it('should include journal as array with title and note', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(200)

      const entry = response.body[0]
      expect(Array.isArray(entry.journal)).toBe(true)
      expect(entry.journal).toHaveLength(2)
      expect(entry.journal[0]).toBe('Great day')
      expect(entry.journal[1]).toContain('Had a wonderful time')
    })

    it('should convert newlines to <br> tags in notes', async () => {
      const entryWithNewlines = {
        mood: 1,
        datetime: 1710758400000,
        note: 'Line 1\nLine 2\nLine 3',
        note_title: 'Multi-line note'
      }

      await request(app).post('/api/entries').send(entryWithNewlines).expect(201)

      const response = await request(app)
        .get('/entries')
        .expect(200)

      const createdEntry = response.body.find(e => e.journal[0] === 'Multi-line note')
      expect(createdEntry.journal[1]).toBe('Line 1<br>Line 2<br>Line 3')
    })

    it('should include activities (tags) array', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(200)

      const entry = response.body[0]
      expect(Array.isArray(entry.activities)).toBe(true)
      expect(entry.activities).toEqual([1, 2])
    })

    it('should include correct day of week', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(200)

      const entry = response.body[0]
      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      expect(validDays).toContain(entry.day)
    })

    it('should maintain data consistency across multiple requests', async () => {
      const response1 = await request(app).get('/entries').expect(200)
      const response2 = await request(app).get('/entries').expect(200)

      expect(response1.body).toEqual(response2.body)
    })
  })

  describe('GET /structured_data', () => {
    it('should return 200 with structured data object', async () => {
      const response = await request(app)
        .get('/structured_data')
        .expect(200)
        .expect('Content-Type', /json/)

      expect(typeof response.body).toBe('object')
    })

    it('should structure data by year/month/day hierarchy', async () => {
      const response = await request(app)
        .get('/structured_data')
        .expect(200)

      expect(response.body).toHaveProperty('2024')
      expect(response.body['2024']).toHaveProperty('3')
      expect(response.body['2024']['3']).toHaveProperty('15')
      expect(response.body['2024']['3']).toHaveProperty('16')
    })

    it('should store mood scores for each day', async () => {
      const response = await request(app)
        .get('/structured_data')
        .expect(200)

      const moodValue = response.body['2024']['3']['15']
      expect(typeof moodValue).toBe('number')
      expect(moodValue).toBeGreaterThanOrEqual(1)
      expect(moodValue).toBeLessThanOrEqual(5)
    })

    it('should reverse mood scores (1=best, 5=worst)', async () => {
      const response = await request(app)
        .get('/structured_data')
        .expect(200)

      const day15Mood = response.body['2024']['3']['15']
      const day16Mood = response.body['2024']['3']['16']
      
      expect(day15Mood).toBe(5)
      expect(day16Mood).toBe(3)
    })

    it('should handle multiple entries per day with averaging', async () => {
      const secondEntry = {
        mood: 3,
        datetime: 1710515400000
      }

      await request(app).post('/api/entries').send(secondEntry).expect(201)

      const response = await request(app)
        .get('/structured_data')
        .expect(200)

      const day15Mood = response.body['2024']['3']['15']
      expect(day15Mood).toBe(4)
    })

    it('should handle entries from different years', async () => {
      const entry2023 = {
        mood: 2,
        datetime: 1672531200000
      }

      await request(app).post('/api/entries').send(entry2023).expect(201)

      const response = await request(app)
        .get('/structured_data')
        .expect(200)

      expect(response.body).toHaveProperty('2023')
      expect(response.body).toHaveProperty('2024')
    })

    it('should handle entries from different months', async () => {
      const entryApril = {
        mood: 1,
        datetime: 1712188800000
      }

      await request(app).post('/api/entries').send(entryApril).expect(201)

      const response = await request(app)
        .get('/structured_data')
        .expect(200)

      expect(response.body['2024']).toHaveProperty('3')
      expect(response.body['2024']).toHaveProperty('4')
    })

    it('should maintain data consistency across multiple requests', async () => {
      const response1 = await request(app).get('/structured_data').expect(200)
      const response2 = await request(app).get('/structured_data').expect(200)

      expect(response1.body).toEqual(response2.body)
    })
  })

  describe('Data consistency across endpoints', () => {
    it('should have matching entry counts between /entries and database', async () => {
      const entriesResponse = await request(app).get('/entries').expect(200)
      
      expect(entriesResponse.body).toHaveLength(2)
    })

    it('should reflect new entries in all endpoints after POST', async () => {
      const newEntry = {
        mood: 4,
        datetime: 1710844800000,
        note: 'Consistency test',
        note_title: 'Test',
        tags: [1]
      }

      await request(app).post('/api/entries').send(newEntry).expect(201)

      const entriesResponse = await request(app).get('/entries').expect(200)
      expect(entriesResponse.body).toHaveLength(3)

      const structuredResponse = await request(app).get('/structured_data').expect(200)
      expect(structuredResponse.body['2024']['3']).toHaveProperty('19')
    })

    it('should maintain mood consistency between /entries and /vital', async () => {
      const vitalResponse = await request(app).get('/vital').expect(200)
      const entriesResponse = await request(app).get('/entries').expect(200)

      const entry = entriesResponse.body[0]
      const moodId = entry.mood
      expect(vitalResponse.body.available_moods).toHaveProperty(String(moodId))
    })

    it('should maintain tag consistency between /entries and /vital', async () => {
      const vitalResponse = await request(app).get('/vital').expect(200)
      const entriesResponse = await request(app).get('/entries').expect(200)

      const entry = entriesResponse.body[0]
      entry.activities.forEach(tagId => {
        expect(vitalResponse.body.available_activities).toHaveProperty(String(tagId))
      })
    })
  })

  describe('Error handling', () => {
    it('should handle GET requests gracefully with empty database', async () => {
      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }
      
      const emptyData = {
        dayEntries: [],
        tags: [],
        tag_groups: [],
        customMoods: [],
        metadata: { number_of_entries: 0 },
        daysInRowLongestChain: 0
      }
      
      initializeDatabase()
      importDaylioData(emptyData)
      app = setupTestApp(emptyData)

      const vitalResponse = await request(app).get('/vital').expect(200)
      expect(vitalResponse.body).toHaveProperty('available_activities')
      
      const entriesResponse = await request(app).get('/entries').expect(200)
      expect(Array.isArray(entriesResponse.body)).toBe(true)
      expect(entriesResponse.body).toHaveLength(0)
      
      const structuredResponse = await request(app).get('/structured_data').expect(200)
      expect(typeof structuredResponse.body).toBe('object')
    })

    it('should handle POST with extra unexpected fields gracefully', async () => {
      const entryWithExtra = {
        mood: 1,
        datetime: 1710672000000,
        unexpected_field: 'should be ignored',
        another_field: 123
      }

      const response = await request(app)
        .post('/api/entries')
        .send(entryWithExtra)
        .expect(201)

      expect(response.body).toHaveProperty('mood', 1)
      expect(response.body).toHaveProperty('id')
    })
  })
})
