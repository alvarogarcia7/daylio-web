const request = require('supertest')
const express = require('express')
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const { initializeDatabase, importDaylioData, loadDataFromDatabase, closeDatabase } = require('../../db/database')
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
      minute: 45,
      hour: 10,
      day: 16,
      month: 3,
      year: 2024,
      datetime: 1710585945000,
      timeZoneOffset: 0,
      mood: 1,
      note_title: 'Great day',
      note: 'Had a wonderful time',
      tags: [1, 2]
    },
    {
      id: 3,
      minute: 0,
      hour: 12,
      day: 13,
      month: 3,
      year: 2024,
      datetime: 1710331200000,
      timeZoneOffset: 0,
      mood: 1,
      note_title: 'Good day',
      note: 'Pretty nice',
      tags: [2]
    },
    {
      id: 2,
      minute: 0,
      hour: 9,
      day: 14,
      month: 3,
      year: 2024,
      datetime: 1710406800000,
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
    number_of_entries: 3
  },
  daysInRowLongestChain: 3
}

function setupTestApp() {
  const testApp = express()
  testApp.use(express.json())

  let daylioData = loadDataFromDatabase()

  testApp.get('/vital', (req, res) => {
    daylioData = loadDataFromDatabase()
    res.json(getReadableData(daylioData))
  })

  testApp.get('/entries', (req, res) => {
    daylioData = loadDataFromDatabase()
    res.json(getEntryData(daylioData))
  })

  testApp.get('/structured_data', (req, res) => {
    daylioData = loadDataFromDatabase()
    const { getEntryData: getED, getReadableData: getRD } = require('../../server')
    const ENTRY_DATA = getED(daylioData)
    const VITAL_DATA = getRD(daylioData)
    
    const structuredData = {}
    
    for (entry in ENTRY_DATA) {
      const entryYear = (ENTRY_DATA[entry].date).split('-')[2]
      const entryMonth = (ENTRY_DATA[entry].date).split('-')[1]
      const entryDay = (ENTRY_DATA[entry].date).split('-')[0]
      const entryMood = VITAL_DATA.available_mood_groups[ENTRY_DATA[entry].mood]
      
      const reverseMoodData = [5, 4, 3, 2, 1]
      const reversedMood = reverseMoodData[entryMood - 1]
      
      if (!structuredData[entryYear])
        structuredData[entryYear] = {}
      
      if (!structuredData[entryYear][entryMonth])
        structuredData[entryYear][entryMonth] = {}
      
      if (structuredData[entryYear][entryMonth][entryDay]) {
        structuredData[entryYear][entryMonth][entryDay] += reversedMood
        structuredData[entryYear][entryMonth][entryDay] /= 2
      } else {
        structuredData[entryYear][entryMonth][entryDay] = reversedMood
      }
    }
    
    res.json(structuredData)
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

    daylioData = loadDataFromDatabase()

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

  testApp.get('/api/export', (req, res) => {
    const { exportDaylioFormat } = require('../../db/repository')
    const result = exportDaylioFormat()

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    const jsonString = JSON.stringify(result.data)
    const base64Data = Buffer.from(jsonString, 'utf-8').toString('base64')

    res.type('application/octet-stream')
    res.setHeader('Content-Disposition', 'attachment; filename="backup.daylio"')
    res.send(base64Data)
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
    app = setupTestApp()
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
          datetime: 1710519600000
        }

        const response = await request(app)
          .post('/api/entries')
          .send(entry)
          .expect(201)

        expect(response.body.year).toBe(2024)
        expect(response.body.month).toBe(3)
        expect(response.body.day).toBe(15)
        expect(response.body.hour).toBe(16)
        expect(response.body.minute).toBe(20)
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
      expect(response.body).toHaveLength(3)
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
      expect(response.body[2].id).toBe(3)
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
      expect(response.body['2024']['3']).toHaveProperty('13')
      expect(response.body['2024']['3']).toHaveProperty('14')
      expect(response.body['2024']['3']).toHaveProperty('16')
    })

    it('should store mood scores for each day', async () => {
      const response = await request(app)
        .get('/structured_data')
        .expect(200)

      const moodValue = response.body['2024']['3']['13']
      expect(typeof moodValue).toBe('number')
      expect(moodValue).toBeGreaterThanOrEqual(1)
      expect(moodValue).toBeLessThanOrEqual(5)
    })

    it('should reverse mood scores (1=best, 5=worst)', async () => {
      const response = await request(app)
        .get('/structured_data')
        .expect(200)

      const day13Mood = response.body['2024']['3']['13']
      const day14Mood = response.body['2024']['3']['14']
      const day16Mood = response.body['2024']['3']['16']
      
      expect(day13Mood).toBe(5)
      expect(day14Mood).toBe(3)
      expect(day16Mood).toBe(5)
    })

    it('should handle multiple entries per day with averaging', async () => {
      const firstEntry = {
        mood: 1,
        datetime: 1710511800000
      }
      
      const secondEntry = {
        mood: 3,
        datetime: 1710515400000
      }

      await request(app).post('/api/entries').send(firstEntry).expect(201)
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
      
      expect(entriesResponse.body).toHaveLength(3)
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
      expect(entriesResponse.body).toHaveLength(4)

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
      app = setupTestApp()

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

  describe('POST /api/entries - Data Reload Integration', () => {
    it('should reflect newly created entry in GET /entries immediately after POST', async () => {
      const initialEntriesResponse = await request(app).get('/entries').expect(200)
      const initialCount = initialEntriesResponse.body.length
      expect(initialCount).toBe(3)

      const newEntry = {
        mood: 2,
        datetime: 1710672000000,
        note: 'Integration test note',
        note_title: 'Integration Test',
        tags: [1, 3]
      }

      const postResponse = await request(app)
        .post('/api/entries')
        .send(newEntry)
        .expect(201)

      expect(postResponse.body).toHaveProperty('id')
      const createdId = postResponse.body.id

      const updatedEntriesResponse = await request(app).get('/entries').expect(200)
      expect(updatedEntriesResponse.body.length).toBe(initialCount + 1)

      const createdEntry = updatedEntriesResponse.body.find(e => e.id === createdId)
      expect(createdEntry).toBeDefined()
      expect(createdEntry.mood).toBe(2)
      expect(createdEntry.journal[0]).toBe('Integration Test')
      expect(createdEntry.journal[1]).toBe('Integration test note')
      expect(createdEntry.activities).toEqual([1, 3])
    })

    it('should reflect newly created entry in GET /structured_data immediately after POST', async () => {
      const newEntry = {
        mood: 1,
        datetime: 1710758400000,
        note: 'Structured data test',
        note_title: 'Test'
      }

      await request(app)
        .post('/api/entries')
        .send(newEntry)
        .expect(201)

      const structuredResponse = await request(app).get('/structured_data').expect(200)
      
      expect(structuredResponse.body).toHaveProperty('2024')
      expect(structuredResponse.body['2024']).toHaveProperty('3')
      expect(structuredResponse.body['2024']['3']).toHaveProperty('18')
      
      const moodValue = structuredResponse.body['2024']['3']['18']
      expect(typeof moodValue).toBe('number')
      expect(moodValue).toBeGreaterThanOrEqual(1)
      expect(moodValue).toBeLessThanOrEqual(5)
    })

    it('should maintain correct entry count across multiple POSTs and GETs', async () => {
      const entry1 = {
        mood: 1,
        datetime: 1710844800000,
        note: 'First entry',
        note_title: 'Entry 1'
      }

      const entry2 = {
        mood: 2,
        datetime: 1710931200000,
        note: 'Second entry',
        note_title: 'Entry 2'
      }

      await request(app).post('/api/entries').send(entry1).expect(201)
      
      const afterFirst = await request(app).get('/entries').expect(200)
      expect(afterFirst.body.length).toBe(4)

      await request(app).post('/api/entries').send(entry2).expect(201)
      
      const afterSecond = await request(app).get('/entries').expect(200)
      expect(afterSecond.body.length).toBe(5)
    })

    it('should preserve existing entries when adding new ones', async () => {
      const initialEntries = await request(app).get('/entries').expect(200)
      const existingIds = initialEntries.body.map(e => e.id)

      const newEntry = {
        mood: 3,
        datetime: 1711017600000,
        note: 'New test entry'
      }

      await request(app).post('/api/entries').send(newEntry).expect(201)

      const updatedEntries = await request(app).get('/entries').expect(200)
      
      existingIds.forEach(id => {
        const stillExists = updatedEntries.body.find(e => e.id === id)
        expect(stillExists).toBeDefined()
      })
    })

    it('should correctly format newly created entry in GET /entries', async () => {
      const newEntry = {
        mood: 4,
        datetime: 1710758400000,
        note: 'Testing formatting',
        note_title: 'Format Test',
        tags: [2]
      }

      await request(app).post('/api/entries').send(newEntry).expect(201)

      const entriesResponse = await request(app).get('/entries').expect(200)
      const createdEntry = entriesResponse.body.find(e => e.journal[0] === 'Format Test')

      expect(createdEntry).toBeDefined()
      expect(createdEntry).toHaveProperty('id')
      expect(createdEntry).toHaveProperty('time')
      expect(createdEntry).toHaveProperty('date')
      expect(createdEntry).toHaveProperty('date_formatted')
      expect(createdEntry).toHaveProperty('day')
      expect(createdEntry).toHaveProperty('journal')
      expect(createdEntry).toHaveProperty('mood')
      expect(createdEntry).toHaveProperty('activities')
      
      expect(createdEntry.time).toMatch(/^\d{2}:\d{2} (AM|PM)$/)
      expect(createdEntry.date).toMatch(/^\d{1,2}-\d{1,2}-\d{4}$/)
      expect(Array.isArray(createdEntry.journal)).toBe(true)
      expect(createdEntry.journal).toHaveLength(2)
      expect(Array.isArray(createdEntry.activities)).toBe(true)
    })

    it('should update structured_data with correct date hierarchy after POST', async () => {
      const newEntry = {
        mood: 2,
        datetime: 1712188800000,
        note: 'April entry'
      }

      const beforePost = await request(app).get('/structured_data').expect(200)
      expect(beforePost.body['2024']).not.toHaveProperty('4')

      await request(app).post('/api/entries').send(newEntry).expect(201)

      const afterPost = await request(app).get('/structured_data').expect(200)
      expect(afterPost.body['2024']).toHaveProperty('4')
      expect(afterPost.body['2024']['4']).toHaveProperty('4')
    })

    it('should handle newlines in notes correctly after POST and GET', async () => {
      const newEntry = {
        mood: 3,
        datetime: 1710844800000,
        note: 'Line 1\nLine 2\nLine 3',
        note_title: 'Multiline'
      }

      await request(app).post('/api/entries').send(newEntry).expect(201)

      const entriesResponse = await request(app).get('/entries').expect(200)
      const createdEntry = entriesResponse.body.find(e => e.journal[0] === 'Multiline')

      expect(createdEntry).toBeDefined()
      expect(createdEntry.journal[1]).toBe('Line 1<br>Line 2<br>Line 3')
    })

    it('should maintain entry order (newest first) after adding new entry', async () => {
      const futureEntry = {
        mood: 1,
        datetime: 1715000000000,
        note: 'Future entry',
        note_title: 'Latest'
      }

      await request(app).post('/api/entries').send(futureEntry).expect(201)

      const entriesResponse = await request(app).get('/entries').expect(200)
      
      expect(entriesResponse.body[0].journal[0]).toBe('Latest')
      
      for (let i = 0; i < entriesResponse.body.length - 1; i++) {
        const currentDate = new Date(entriesResponse.body[i].date.split('-').reverse().join('-'))
        const nextDate = new Date(entriesResponse.body[i + 1].date.split('-').reverse().join('-'))
        expect(currentDate >= nextDate).toBe(true)
      }
    })

    it('should correctly average moods when multiple entries exist on same day', async () => {
      const entry1 = {
        mood: 1,
        datetime: 1710511800000
      }

      const entry2 = {
        mood: 3,
        datetime: 1710515400000
      }

      await request(app).post('/api/entries').send(entry1).expect(201)
      await request(app).post('/api/entries').send(entry2).expect(201)

      const structuredResponse = await request(app).get('/structured_data').expect(200)
      
      const moodValue = structuredResponse.body['2024']['3']['15']
      expect(moodValue).toBeCloseTo(4, 1)
    })

    it('should handle entries with empty optional fields after reload', async () => {
      const minimalEntry = {
        mood: 2,
        datetime: 1710931200000
      }

      await request(app).post('/api/entries').send(minimalEntry).expect(201)

      const entriesResponse = await request(app).get('/entries').expect(200)
      const createdEntry = entriesResponse.body.find(e => 
        e.date === '20-3-2024' && e.journal[0] === '' && e.journal[1] === ''
      )

      expect(createdEntry).toBeDefined()
      expect(createdEntry.journal).toEqual(['', ''])
      expect(createdEntry.activities).toEqual([])
    })
  })

  describe('GET /api/export', () => {
    const getResponseText = (response) => response.body ? response.body.toString() : response.text

    it('should return 200 with base64 encoded backup data', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)
        .expect('Content-Disposition', 'attachment; filename="backup.daylio"')

      expect(response.headers['content-type']).toContain('application/octet-stream')
      const responseText = getResponseText(response)
      expect(typeof responseText).toBe('string')
      expect(responseText.length).toBeGreaterThan(0)
    })

    it('should export valid base64 data that can be decoded', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      expect(() => JSON.parse(decoded)).not.toThrow()
    })

    it('should export data with correct Daylio backup structure', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      expect(exportData).toHaveProperty('version')
      expect(exportData).toHaveProperty('daysInRowLongestChain')
      expect(exportData).toHaveProperty('metadata')
      expect(exportData).toHaveProperty('customMoods')
      expect(exportData).toHaveProperty('tag_groups')
      expect(exportData).toHaveProperty('tags')
      expect(exportData).toHaveProperty('dayEntries')
    })

    it('should export metadata with correct number of entries', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      expect(exportData.metadata.number_of_entries).toBe(3)
    })

    it('should export all day entries with correct structure', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      expect(Array.isArray(exportData.dayEntries)).toBe(true)
      expect(exportData.dayEntries).toHaveLength(3)

      const entry = exportData.dayEntries[0]
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('minute')
      expect(entry).toHaveProperty('hour')
      expect(entry).toHaveProperty('day')
      expect(entry).toHaveProperty('month')
      expect(entry).toHaveProperty('year')
      expect(entry).toHaveProperty('datetime')
      expect(entry).toHaveProperty('timeZoneOffset')
      expect(entry).toHaveProperty('mood')
      expect(entry).toHaveProperty('note_title')
      expect(entry).toHaveProperty('note')
      expect(entry).toHaveProperty('tags')
      expect(Array.isArray(entry.tags)).toBe(true)
    })

    it('should export all tags with correct structure', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      expect(Array.isArray(exportData.tags)).toBe(true)
      expect(exportData.tags).toHaveLength(3)

      const tag = exportData.tags[0]
      expect(tag).toHaveProperty('id')
      expect(tag).toHaveProperty('name')
      expect(tag).toHaveProperty('id_tag_group')
      expect(tag).toHaveProperty('icon')
      expect(tag).toHaveProperty('order')
      expect(tag).toHaveProperty('state')
      expect(tag).toHaveProperty('createdAt')
    })

    it('should export all tag groups with correct structure', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      expect(Array.isArray(exportData.tag_groups)).toBe(true)
      expect(exportData.tag_groups).toHaveLength(2)

      const tagGroup = exportData.tag_groups[0]
      expect(tagGroup).toHaveProperty('id')
      expect(tagGroup).toHaveProperty('name')
      expect(tagGroup).toHaveProperty('order')
    })

    it('should export all custom moods with correct structure', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      expect(Array.isArray(exportData.customMoods)).toBe(true)
      expect(exportData.customMoods).toHaveLength(5)

      const mood = exportData.customMoods[0]
      expect(mood).toHaveProperty('id')
      expect(mood).toHaveProperty('custom_name')
      expect(mood).toHaveProperty('mood_group_id')
      expect(mood).toHaveProperty('icon_id')
      expect(mood).toHaveProperty('predefined_name_id')
      expect(mood).toHaveProperty('state')
      expect(mood).toHaveProperty('createdAt')
    })

    it('should export entries in ID order', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      expect(exportData.dayEntries[0].id).toBe(1)
      expect(exportData.dayEntries[1].id).toBe(2)
      expect(exportData.dayEntries[2].id).toBe(3)
    })

    it('should export tags in order_index order', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      for (let i = 0; i < exportData.tags.length - 1; i++) {
        expect(exportData.tags[i].order).toBeLessThanOrEqual(exportData.tags[i + 1].order)
      }
    })

    it('should export moods in mood_group_id order', async () => {
      const response = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(response)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      for (let i = 0; i < exportData.customMoods.length - 1; i++) {
        expect(exportData.customMoods[i].mood_group_id).toBeLessThanOrEqual(exportData.customMoods[i + 1].mood_group_id)
      }
    })
  })

  describe('Export and Re-import Round Trip', () => {
    const getResponseText = (response) => response.body ? response.body.toString() : response.text

    it('should maintain all entry data through export and re-import', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()

      expect(reloadedData.dayEntries.length).toBe(mockDaylioData.dayEntries.length)
      
      for (let i = 0; i < mockDaylioData.dayEntries.length; i++) {
        const original = mockDaylioData.dayEntries[i]
        const reloaded = reloadedData.dayEntries.find(e => e.id === original.id)
        
        expect(reloaded).toBeDefined()
        expect(reloaded.id).toBe(original.id)
        expect(reloaded.minute).toBe(original.minute)
        expect(reloaded.hour).toBe(original.hour)
        expect(reloaded.day).toBe(original.day)
        expect(reloaded.month).toBe(original.month)
        expect(reloaded.year).toBe(original.year)
        expect(reloaded.datetime).toBe(original.datetime)
        expect(reloaded.timeZoneOffset).toBe(original.timeZoneOffset)
        expect(reloaded.mood).toBe(original.mood)
        expect(reloaded.note_title).toBe(original.note_title)
        expect(reloaded.note).toBe(original.note)
        expect(reloaded.tags).toEqual(original.tags)
      }
    })

    it('should maintain all tag data through export and re-import', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()

      expect(reloadedData.tags.length).toBe(mockDaylioData.tags.length)
      
      for (let i = 0; i < mockDaylioData.tags.length; i++) {
        const original = mockDaylioData.tags[i]
        const reloaded = reloadedData.tags.find(t => t.id === original.id)
        
        expect(reloaded).toBeDefined()
        expect(reloaded.id).toBe(original.id)
        expect(reloaded.name).toBe(original.name)
        expect(reloaded.id_tag_group).toBe(original.id_tag_group)
        expect(reloaded.icon).toBe(original.icon)
        expect(reloaded.order).toBe(original.order)
        expect(reloaded.state).toBe(original.state)
        expect(reloaded.createdAt).toBe(original.createdAt)
      }
    })

    it('should maintain all tag group data through export and re-import', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()

      expect(reloadedData.tag_groups.length).toBe(mockDaylioData.tag_groups.length)
      
      for (let i = 0; i < mockDaylioData.tag_groups.length; i++) {
        const original = mockDaylioData.tag_groups[i]
        const reloaded = reloadedData.tag_groups.find(g => g.id === original.id)
        
        expect(reloaded).toBeDefined()
        expect(reloaded.id).toBe(original.id)
        expect(reloaded.name).toBe(original.name)
        expect(reloaded.order).toBe(original.order)
      }
    })

    it('should maintain all mood data through export and re-import', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()

      expect(reloadedData.customMoods.length).toBe(mockDaylioData.customMoods.length)
      
      for (let i = 0; i < mockDaylioData.customMoods.length; i++) {
        const original = mockDaylioData.customMoods[i]
        const reloaded = reloadedData.customMoods.find(m => m.id === original.id)
        
        expect(reloaded).toBeDefined()
        expect(reloaded.id).toBe(original.id)
        expect(reloaded.custom_name).toBe(original.custom_name)
        expect(reloaded.mood_group_id).toBe(original.mood_group_id)
        expect(reloaded.icon_id).toBe(original.icon_id)
        expect(reloaded.predefined_name_id).toBe(original.predefined_name_id)
        expect(reloaded.state).toBe(original.state)
        expect(reloaded.createdAt).toBe(original.createdAt)
      }
    })

    it('should maintain metadata through export and re-import', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      expect(exportData.metadata.number_of_entries).toBe(mockDaylioData.metadata.number_of_entries)
      expect(exportData.version).toBe(15)

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()

      expect(reloadedData.metadata.number_of_entries).toBe(mockDaylioData.metadata.number_of_entries)
    })

    it('should handle entries with newlines in notes through round trip', async () => {
      const entryWithNewlines = {
        mood: 1,
        datetime: 1710758400000,
        note: 'Line 1\nLine 2\nLine 3',
        note_title: 'Multi-line note'
      }

      await request(app).post('/api/entries').send(entryWithNewlines).expect(201)

      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      const exportedEntry = exportData.dayEntries.find(e => e.note_title === 'Multi-line note')
      expect(exportedEntry.note).toBe('Line 1\nLine 2\nLine 3')

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()
      const reloadedEntry = reloadedData.dayEntries.find(e => e.note_title === 'Multi-line note')
      expect(reloadedEntry.note).toBe('Line 1\nLine 2\nLine 3')
    })

    it('should handle entries with empty optional fields through round trip', async () => {
      const minimalEntry = {
        mood: 2,
        datetime: 1710931200000
      }

      await request(app).post('/api/entries').send(minimalEntry).expect(201)

      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      const exportedEntry = exportData.dayEntries.find(e => e.datetime === 1710931200000)
      expect(exportedEntry.note_title).toBe('')
      expect(exportedEntry.note).toBe('')
      expect(exportedEntry.tags).toEqual([])

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()
      const reloadedEntry = reloadedData.dayEntries.find(e => e.datetime === 1710931200000)
      expect(reloadedEntry.note_title).toBe('')
      expect(reloadedEntry.note).toBe('')
      expect(reloadedEntry.tags).toEqual([])
    })

    it('should maintain exact ordering through round trip', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()

      for (let i = 0; i < exportData.dayEntries.length; i++) {
        const exportedEntry = exportData.dayEntries[i]
        const reloadedEntry = reloadedData.dayEntries.find(e => e.id === exportedEntry.id)
        expect(reloadedEntry).toBeDefined()
      }

      for (let i = 0; i < exportData.tags.length; i++) {
        const exportedTag = exportData.tags[i]
        const reloadedTag = reloadedData.tags.find(t => t.id === exportedTag.id)
        expect(reloadedTag).toBeDefined()
        expect(reloadedTag.order).toBe(exportedTag.order)
      }

      for (let i = 0; i < exportData.customMoods.length; i++) {
        const exportedMood = exportData.customMoods[i]
        const reloadedMood = reloadedData.customMoods.find(m => m.id === exportedMood.id)
        expect(reloadedMood).toBeDefined()
        expect(reloadedMood.mood_group_id).toBe(exportedMood.mood_group_id)
      }
    })

    it('should handle tag-to-entry relationships through round trip', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()

      for (const originalEntry of mockDaylioData.dayEntries) {
        const reloadedEntry = reloadedData.dayEntries.find(e => e.id === originalEntry.id)
        expect(reloadedEntry.tags).toEqual(originalEntry.tags)
        
        reloadedEntry.tags.forEach(tagId => {
          const tag = reloadedData.tags.find(t => t.id === tagId)
          expect(tag).toBeDefined()
        })
      }
    })

    it('should handle tag-to-tag-group relationships through round trip', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .buffer()
        .expect(200)

      const responseText = getResponseText(exportResponse)
      const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
      const exportData = JSON.parse(decoded)

      closeDatabase()
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
      }

      initializeDatabase()
      importDaylioData(exportData)
      app = setupTestApp()

      const reloadedData = loadDataFromDatabase()

      for (const originalTag of mockDaylioData.tags) {
        const reloadedTag = reloadedData.tags.find(t => t.id === originalTag.id)
        expect(reloadedTag.id_tag_group).toBe(originalTag.id_tag_group)
        
        const tagGroup = reloadedData.tag_groups.find(g => g.id === reloadedTag.id_tag_group)
        expect(tagGroup).toBeDefined()
      }
    })

    it('should perform multiple consecutive round trips without data loss', async () => {
      let currentData = mockDaylioData

      for (let iteration = 0; iteration < 3; iteration++) {
        closeDatabase()
        if (fs.existsSync(TEST_DB_PATH)) {
          fs.unlinkSync(TEST_DB_PATH)
        }

        initializeDatabase()
        importDaylioData(currentData)
        app = setupTestApp()

        const exportResponse = await request(app)
          .get('/api/export')
          .buffer()
          .expect(200)

        const responseText = getResponseText(exportResponse)
        const decoded = Buffer.from(responseText, 'base64').toString('utf-8')
        currentData = JSON.parse(decoded)

        expect(currentData.dayEntries.length).toBe(mockDaylioData.dayEntries.length)
        expect(currentData.tags.length).toBe(mockDaylioData.tags.length)
        expect(currentData.tag_groups.length).toBe(mockDaylioData.tag_groups.length)
        expect(currentData.customMoods.length).toBe(mockDaylioData.customMoods.length)

        for (const originalEntry of mockDaylioData.dayEntries) {
          const roundTripEntry = currentData.dayEntries.find(e => e.id === originalEntry.id)
          expect(roundTripEntry).toBeDefined()
          expect(roundTripEntry.datetime).toBe(originalEntry.datetime)
          expect(roundTripEntry.mood).toBe(originalEntry.mood)
          expect(roundTripEntry.note).toBe(originalEntry.note)
        }
      }
    })
  })
})
