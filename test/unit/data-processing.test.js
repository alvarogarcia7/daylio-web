const moment = require('moment')

let getEntryData, getReadableData, getStructuredEntries, getMetadata, originalDaylioData

beforeAll(() => {
  const serverModule = require('../../server')
  getEntryData = serverModule.getEntryData
  getReadableData = serverModule.getReadableData
  getStructuredEntries = serverModule.getStructuredEntries
  getMetadata = serverModule.getMetadata
})

beforeEach(() => {
  originalDaylioData = global.DAYLIO_DATA
  global.DAYLIO_DATA = {
    dayEntries: [],
    tags: [],
    tag_groups: [],
    customMoods: [],
    daysInRowLongestChain: 0,
    metadata: { number_of_entries: 0 }
  }
})

afterEach(() => {
  global.DAYLIO_DATA = originalDaylioData
})

describe('getEntryData', () => {
  test('should return empty array for empty dayEntries', () => {
    const rawData = {
      dayEntries: []
    }
    
    const result = getEntryData(rawData)
    
    expect(result).toEqual([])
  })
  
  test('should transform single entry correctly', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: 'My Day',
          note: 'Had a great day',
          mood: 5,
          tags: [1, 2]
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
    expect(result[0].date).toBe('15-6-2023')
    expect(result[0].date_formatted).toBe('15th Jun 2023')
    expect(result[0].journal).toEqual(['My Day', 'Had a great day'])
    expect(result[0].mood).toBe(5)
    expect(result[0].activities).toEqual([1, 2])
    expect(result[0].time).toBeDefined()
    expect(result[0].day).toBeDefined()
  })
  
  test('should format time correctly', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 3,
          tags: []
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    expect(result[0].time).toMatch(/^\d{2}:\d{2} (AM|PM)$/)
  })
  
  test('should format date correctly for different months', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1704067200000,
          timeZoneOffset: 0,
          day: 1,
          month: 1,
          year: 2024,
          note_title: '',
          note: '',
          mood: 3,
          tags: []
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    expect(result[0].date).toBe('1-1-2024')
    expect(result[0].date_formatted).toContain('Jan')
    expect(result[0].date_formatted).toContain('2024')
  })
  
  test('should convert day of week correctly', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 3,
          tags: []
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    const expectedDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    expect(expectedDays).toContain(result[0].day)
  })
  
  test('should replace newlines with <br> in notes', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: 'Multi-line',
          note: 'Line 1\nLine 2\nLine 3',
          mood: 3,
          tags: []
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    expect(result[0].journal[1]).toBe('Line 1<br>Line 2<br>Line 3')
  })
  
  test('should handle empty note and note_title', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 3,
          tags: []
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    expect(result[0].journal).toEqual(['', ''])
  })
  
  test('should handle multiple entries', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: 'Day 1',
          note: 'Note 1',
          mood: 5,
          tags: [1]
        },
        {
          id: 2,
          datetime: 1686930600000,
          timeZoneOffset: 0,
          day: 16,
          month: 6,
          year: 2023,
          note_title: 'Day 2',
          note: 'Note 2',
          mood: 3,
          tags: [2]
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(2)
  })
  
  test('should handle timezone offset', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: -14400000,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 3,
          tags: []
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    expect(result[0]).toBeDefined()
    expect(result[0].id).toBe(1)
  })
  
  test('should handle empty tags array', () => {
    const rawData = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 3,
          tags: []
        }
      ]
    }
    
    const result = getEntryData(rawData)
    
    expect(result[0].activities).toEqual([])
  })
})

describe('getReadableData', () => {
  test('should return empty objects for empty rawData', () => {
    const rawData = {
      tags: [],
      tag_groups: [],
      customMoods: []
    }
    
    const result = getReadableData(rawData)
    
    expect(result.available_activities).toEqual({})
    expect(result.available_activity_groups).toEqual({})
    expect(result.available_moods).toEqual({})
    expect(result.available_mood_groups).toEqual({})
    expect(result.ordered_mood_list).toEqual([])
    expect(result.months).toHaveLength(12)
  })
  
  test('should transform activities correctly', () => {
    const rawData = {
      tags: [
        { id: 1, name: 'work', id_tag_group: 10, icon: 'work_icon' },
        { id: 2, name: 'exercise', id_tag_group: 10, icon: 'exercise_icon' }
      ],
      tag_groups: [],
      customMoods: []
    }
    
    const result = getReadableData(rawData)
    
    expect(result.available_activities[1]).toEqual({
      name: 'work',
      group: 10,
      icon: 'work_icon'
    })
    expect(result.available_activities[2]).toEqual({
      name: 'exercise',
      group: 10,
      icon: 'exercise_icon'
    })
  })
  
  test('should transform activity groups correctly', () => {
    const rawData = {
      tags: [],
      tag_groups: [
        { id: 10, name: 'Activities' },
        { id: 20, name: 'People' }
      ],
      customMoods: []
    }
    
    const result = getReadableData(rawData)
    
    expect(result.available_activity_groups[10]).toBe('Activities')
    expect(result.available_activity_groups[20]).toBe('People')
  })
  
  test('should transform moods correctly', () => {
    const rawData = {
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 },
        { id: 2, custom_name: 'good', mood_group_id: 4 },
        { id: 3, custom_name: 'meh', mood_group_id: 3 }
      ]
    }
    
    const result = getReadableData(rawData)
    
    expect(result.available_moods[1]).toBe('rad')
    expect(result.available_moods[2]).toBe('good')
    expect(result.available_moods[3]).toBe('meh')
  })
  
  test('should transform mood groups correctly', () => {
    const rawData = {
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 },
        { id: 2, custom_name: 'good', mood_group_id: 4 }
      ]
    }
    
    const result = getReadableData(rawData)
    
    expect(result.available_mood_groups[1]).toBe(5)
    expect(result.available_mood_groups[2]).toBe(4)
  })
  
  test('should create ordered mood list', () => {
    const rawData = {
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 },
        { id: 2, custom_name: 'good', mood_group_id: 4 },
        { id: 3, custom_name: 'meh', mood_group_id: 3 }
      ]
    }
    
    const result = getReadableData(rawData)
    
    expect(result.ordered_mood_list).toEqual(['rad', 'good', 'meh'])
  })
  
  test('should include months array', () => {
    const rawData = {
      tags: [],
      tag_groups: [],
      customMoods: []
    }
    
    const result = getReadableData(rawData)
    
    expect(result.months).toEqual([
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ])
  })
  
  test('should handle complete dataset', () => {
    const rawData = {
      tags: [
        { id: 1, name: 'work', id_tag_group: 10, icon: 'work_icon' },
        { id: 2, name: 'exercise', id_tag_group: 10, icon: 'exercise_icon' }
      ],
      tag_groups: [
        { id: 10, name: 'Activities' },
        { id: 20, name: 'People' }
      ],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 },
        { id: 2, custom_name: 'good', mood_group_id: 4 }
      ]
    }
    
    const result = getReadableData(rawData)
    
    expect(Object.keys(result.available_activities)).toHaveLength(2)
    expect(Object.keys(result.available_activity_groups)).toHaveLength(2)
    expect(Object.keys(result.available_moods)).toHaveLength(2)
    expect(Object.keys(result.available_mood_groups)).toHaveLength(2)
    expect(result.ordered_mood_list).toHaveLength(2)
  })
  
  test('should use array indices for iteration', () => {
    const rawData = {
      tags: [
        { id: 5, name: 'work', id_tag_group: 10, icon: 'work_icon' }
      ],
      tag_groups: [
        { id: 15, name: 'Activities' }
      ],
      customMoods: [
        { id: 25, custom_name: 'rad', mood_group_id: 5 }
      ]
    }
    
    const result = getReadableData(rawData)
    
    expect(result.available_activities[5]).toBeDefined()
    expect(result.available_activity_groups[15]).toBeDefined()
    expect(result.available_moods[25]).toBeDefined()
  })
})

describe('getStructuredEntries', () => {
  beforeEach(() => {
    global.DAYLIO_DATA = {
      dayEntries: [],
      tags: [],
      tag_groups: [],
      customMoods: [],
      daysInRowLongestChain: 0,
      metadata: { number_of_entries: 0 }
    }
  })
  
  test('should return empty object for no entries', () => {
    global.DAYLIO_DATA = {
      dayEntries: [],
      tags: [],
      tag_groups: [],
      customMoods: []
    }
    
    const result = getStructuredEntries()
    
    expect(result).toEqual({})
  })
  
  test('should structure single entry by year/month/day', () => {
    global.DAYLIO_DATA = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 1,
          tags: []
        }
      ],
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 }
      ]
    }
    
    const result = getStructuredEntries()
    
    expect(result['2023']).toBeDefined()
    expect(result['2023']['6']).toBeDefined()
    expect(result['2023']['6']['15']).toBeDefined()
    expect(typeof result['2023']['6']['15']).toBe('number')
  })
  
  test('should reverse mood scores (5->1, 1->5)', () => {
    global.DAYLIO_DATA = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 1,
          tags: []
        }
      ],
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 }
      ]
    }
    
    const result = getStructuredEntries()
    
    expect(result['2023']['6']['15']).toBe(1)
  })
  
  test('should average multiple entries for same day', () => {
    global.DAYLIO_DATA = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 1,
          tags: []
        },
        {
          id: 2,
          datetime: 1686844300000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 2,
          tags: []
        }
      ],
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 },
        { id: 2, custom_name: 'good', mood_group_id: 3 }
      ]
    }
    
    const result = getStructuredEntries()
    
    expect(result['2023']['6']['15']).toBe(2)
  })
  
  test('should handle entries across multiple months', () => {
    global.DAYLIO_DATA = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 1,
          tags: []
        },
        {
          id: 2,
          datetime: 1689436200000,
          timeZoneOffset: 0,
          day: 15,
          month: 7,
          year: 2023,
          note_title: '',
          note: '',
          mood: 1,
          tags: []
        }
      ],
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 }
      ]
    }
    
    const result = getStructuredEntries()
    
    expect(result['2023']['6']).toBeDefined()
    expect(result['2023']['7']).toBeDefined()
    expect(result['2023']['6']['15']).toBeDefined()
    expect(result['2023']['7']['15']).toBeDefined()
  })
  
  test('should handle entries across multiple years', () => {
    global.DAYLIO_DATA = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 1,
          tags: []
        },
        {
          id: 2,
          datetime: 1718380200000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2024,
          note_title: '',
          note: '',
          mood: 1,
          tags: []
        }
      ],
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 }
      ]
    }
    
    const result = getStructuredEntries()
    
    expect(result['2023']).toBeDefined()
    expect(result['2024']).toBeDefined()
  })
  
  test('should handle all 5 mood group levels', () => {
    global.DAYLIO_DATA = {
      dayEntries: [
        {
          id: 1,
          datetime: 1686844200000,
          timeZoneOffset: 0,
          day: 11,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 1,
          tags: []
        },
        {
          id: 2,
          datetime: 1686844300000,
          timeZoneOffset: 0,
          day: 12,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 2,
          tags: []
        },
        {
          id: 3,
          datetime: 1686844400000,
          timeZoneOffset: 0,
          day: 13,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 3,
          tags: []
        },
        {
          id: 4,
          datetime: 1686844500000,
          timeZoneOffset: 0,
          day: 14,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 4,
          tags: []
        },
        {
          id: 5,
          datetime: 1686844600000,
          timeZoneOffset: 0,
          day: 15,
          month: 6,
          year: 2023,
          note_title: '',
          note: '',
          mood: 5,
          tags: []
        }
      ],
      tags: [],
      tag_groups: [],
      customMoods: [
        { id: 1, custom_name: 'rad', mood_group_id: 5 },
        { id: 2, custom_name: 'good', mood_group_id: 4 },
        { id: 3, custom_name: 'meh', mood_group_id: 3 },
        { id: 4, custom_name: 'bad', mood_group_id: 2 },
        { id: 5, custom_name: 'awful', mood_group_id: 1 }
      ]
    }
    
    const result = getStructuredEntries()
    
    expect(result['2023']['6']['11']).toBe(1)
    expect(result['2023']['6']['12']).toBe(2)
    expect(result['2023']['6']['13']).toBe(3)
    expect(result['2023']['6']['14']).toBe(4)
    expect(result['2023']['6']['15']).toBe(5)
  })
})

describe('getMetadata', () => {
  test('should return metadata with longestDaysInRow', () => {
    const rawData = {
      daysInRowLongestChain: 10,
      metadata: {
        number_of_entries: 50
      }
    }
    
    const result = getMetadata(rawData)
    
    expect(result.longestDaysInRow).toBe(10)
    expect(result.numberOfEntries).toBe(50)
  })
  
  test('should handle zero values', () => {
    const rawData = {
      daysInRowLongestChain: 0,
      metadata: {
        number_of_entries: 0
      }
    }
    
    const result = getMetadata(rawData)
    
    expect(result.longestDaysInRow).toBe(0)
    expect(result.numberOfEntries).toBe(0)
  })
  
  test('should handle large values', () => {
    const rawData = {
      daysInRowLongestChain: 365,
      metadata: {
        number_of_entries: 1000
      }
    }
    
    const result = getMetadata(rawData)
    
    expect(result.longestDaysInRow).toBe(365)
    expect(result.numberOfEntries).toBe(1000)
  })
  
  test('should return object with correct keys', () => {
    const rawData = {
      daysInRowLongestChain: 5,
      metadata: {
        number_of_entries: 10
      }
    }
    
    const result = getMetadata(rawData)
    
    expect(result).toHaveProperty('longestDaysInRow')
    expect(result).toHaveProperty('numberOfEntries')
    expect(Object.keys(result)).toHaveLength(2)
  })
  
  test('should handle missing metadata gracefully', () => {
    const rawData = {
      daysInRowLongestChain: 5,
      metadata: {}
    }
    
    const result = getMetadata(rawData)
    
    expect(result.longestDaysInRow).toBe(5)
    expect(result.numberOfEntries).toBeUndefined()
  })
})
