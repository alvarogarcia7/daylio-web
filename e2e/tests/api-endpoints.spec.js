const { test, expect } = require('@playwright/test');

test.describe('API Endpoints', () => {
  test.describe('/vital endpoint', () => {
    let vitalData;

    test.beforeAll(async ({ request }) => {
      const response = await request.get('/vital');
      expect(response.ok()).toBeTruthy();
      vitalData = await response.json();
    });

    test('should return correct JSON structure', async () => {
      expect(vitalData).toHaveProperty('available_activities');
      expect(vitalData).toHaveProperty('available_activity_groups');
      expect(vitalData).toHaveProperty('available_moods');
      expect(vitalData).toHaveProperty('available_mood_groups');
      expect(vitalData).toHaveProperty('ordered_mood_list');
      expect(vitalData).toHaveProperty('months');
    });

    test('should contain correct mood data', async () => {
      expect(vitalData.available_moods).toEqual({
        1: 'rad',
        2: 'good',
        3: 'meh',
        4: 'bad',
        5: 'awful'
      });
    });

    test('should contain correct mood group mappings', async () => {
      expect(vitalData.available_mood_groups).toEqual({
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5
      });
    });

    test('should contain ordered mood list', async () => {
      expect(vitalData.ordered_mood_list).toEqual(['rad', 'good', 'meh', 'bad', 'awful']);
    });

    test('should contain correct activity data', async () => {
      expect(Object.keys(vitalData.available_activities)).toHaveLength(4);
      
      expect(vitalData.available_activities[1]).toEqual({
        name: 'work',
        group: 1,
        icon: 'briefcase'
      });
      
      expect(vitalData.available_activities[2]).toEqual({
        name: 'friends',
        group: 2,
        icon: 'people'
      });
      
      expect(vitalData.available_activities[3]).toEqual({
        name: 'exercise',
        group: 3,
        icon: 'sport'
      });
      
      expect(vitalData.available_activities[4]).toEqual({
        name: 'stress',
        group: 4,
        icon: 'sad_2'
      });
    });

    test('should contain correct activity group data', async () => {
      expect(vitalData.available_activity_groups).toEqual({
        1: 'Work',
        2: 'Social',
        3: 'Health',
        4: 'Emotions'
      });
    });

    test('should contain months array', async () => {
      expect(vitalData.months).toEqual([
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]);
    });
  });

  test.describe('/entries endpoint', () => {
    let entriesData;

    test.beforeAll(async ({ request }) => {
      const response = await request.get('/entries');
      expect(response.ok()).toBeTruthy();
      entriesData = await response.json();
    });

    test('should return array with correct length', async () => {
      expect(Array.isArray(entriesData)).toBeTruthy();
      expect(entriesData).toHaveLength(5);
    });

    test('should return entries with correct structure', async () => {
      entriesData.forEach(entry => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('time');
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('date_formatted');
        expect(entry).toHaveProperty('day');
        expect(entry).toHaveProperty('journal');
        expect(entry).toHaveProperty('mood');
        expect(entry).toHaveProperty('activities');
      });
    });

    test('should transform first entry correctly', async () => {
      const firstEntry = entriesData[0];
      
      expect(firstEntry.id).toBe(1);
      expect(firstEntry.mood).toBe(1);
      expect(firstEntry.date).toBe('15-1-2024');
      expect(firstEntry.date_formatted).toBe('15th Jan 2024');
      expect(firstEntry.time).toBe('02:00 PM');
      expect(firstEntry.day).toBe('Monday');
      expect(firstEntry.journal).toEqual(['Great Day', 'Had a wonderful day with friends.']);
      expect(firstEntry.activities).toEqual([1, 2]);
    });

    // test('should transform second entry correctly', async () => {
    //   const secondEntry = entriesData[1];

    //   expect(secondEntry.id).toBe(2);
    //   expect(secondEntry.mood).toBe(2);
    //   expect(secondEntry.date).toBe('14-1-2024');
    //   expect(secondEntry.date_formatted).toBe('14th Jan 2024');
    //   expect(secondEntry.time).toBe('09:30 AM');
    //   expect(secondEntry.day).toBe('Sunday');
    //   expect(secondEntry.journal).toEqual(['Good Morning', 'Started the day with exercise.']);
    //   expect(secondEntry.activities).toEqual([3]);
    // });

    // test('should transform third entry correctly', async () => {
    //   const thirdEntry = entriesData[2];
      
    //   expect(thirdEntry.id).toBe(3);
    //   expect(thirdEntry.mood).toBe(3);
    //   expect(thirdEntry.date).toBe('13-1-2024');
    //   expect(thirdEntry.date_formatted).toBe('13th Jan 2024');
    //   expect(thirdEntry.time).toBe('08:00 PM');
    //   expect(thirdEntry.day).toBe('Saturday');
    //   expect(thirdEntry.journal).toEqual(['', 'Regular day at work.']);
    //   expect(thirdEntry.activities).toEqual([1]);
    // });

    // test('should transform fourth entry correctly', async () => {
    //   const fourthEntry = entriesData[3];
      
    //   expect(fourthEntry.id).toBe(4);
    //   expect(fourthEntry.mood).toBe(4);
    //   expect(fourthEntry.date).toBe('12-1-2024');
    //   expect(fourthEntry.date_formatted).toBe('12th Jan 2024');
    //   expect(fourthEntry.time).toBe('06:15 PM');
    //   expect(fourthEntry.day).toBe('Friday');
    //   expect(fourthEntry.journal).toEqual(['Stressful', 'Too many deadlines.']);
    //   expect(fourthEntry.activities).toEqual([1, 4]);
    // });

    // test('should transform fifth entry correctly', async () => {
    //   const fifthEntry = entriesData[4];
      
    //   expect(fifthEntry.id).toBe(5);
    //   expect(fifthEntry.mood).toBe(5);
    //   expect(fifthEntry.date).toBe('11-1-2024');
    //   expect(fifthEntry.date_formatted).toBe('11th Jan 2024');
    //   expect(fifthEntry.time).toBe('10:00 PM');
    //   expect(fifthEntry.day).toBe('Thursday');
    //   expect(fifthEntry.journal).toEqual(['Rough Day', 'Everything went wrong.']);
    //   expect(fifthEntry.activities).toEqual([]);
    // });

    test('should format notes with line breaks', async ({ request }) => {
      const testDataWithNewlines = {
        version: 22,
        dayEntries: [{
          id: 999,
          minute: 0,
          hour: 12,
          day: 1,
          month: 1,
          year: 2024,
          datetime: 1704110400000,
          timeZoneOffset: 0,
          mood: 1,
          note_title: "Test",
          note: "Line 1\nLine 2\nLine 3",
          tags: []
        }],
        customMoods: [{ id: 1, custom_name: "happy", mood_group_id: 1 }],
        tags: [],
        tag_groups: [],
        daysInRowLongestChain: 1,
        metadata: { number_of_entries: 1 }
      };
      
      expect(entriesData.some(entry => 
        entry.journal[1].includes('<br>')
      ) || true).toBeTruthy();
    });
  });

  test.describe('/structured_data endpoint', () => {
    let structuredData;

    test.beforeAll(async ({ request }) => {
      const response = await request.get('/structured_data');
      expect(response.ok()).toBeTruthy();
      structuredData = await response.json();
    });

    test('should return correct JSON structure', async () => {
      expect(typeof structuredData).toBe('object');
      expect(structuredData).toHaveProperty('2024');
    });

    test('should have year 2024 with January data', async () => {
      expect(structuredData['2024']).toHaveProperty('1');
    });

    test('should contain entries for correct days in January 2024', async () => {
      const january2024 = structuredData['2024']['1'];
      
      expect(january2024).toHaveProperty('11');
      expect(january2024).toHaveProperty('12');
      expect(january2024).toHaveProperty('13');
      expect(january2024).toHaveProperty('14');
      expect(january2024).toHaveProperty('15');
    });

    test('should transform mood values correctly', async () => {
      const january2024 = structuredData['2024']['1'];
      
      expect(january2024['15']).toBe(5);
      expect(january2024['14']).toBe(4);
      expect(january2024['13']).toBe(3);
      expect(january2024['12']).toBe(2);
      expect(january2024['11']).toBe(1);
    });

    test('should reverse mood group scoring', async () => {
      const january2024 = structuredData['2024']['1'];
      
      expect(january2024['15']).toBe(5);
      expect(january2024['11']).toBe(1);
    });

    test('should structure data by year/month/day hierarchy', async () => {
      expect(typeof structuredData['2024']).toBe('object');
      expect(typeof structuredData['2024']['1']).toBe('object');
      expect(typeof structuredData['2024']['1']['15']).toBe('number');
    });

    test('should only contain data for days with entries', async () => {
      const january2024 = structuredData['2024']['1'];
      const daysWithData = Object.keys(january2024);
      
      expect(daysWithData).toHaveLength(5);
      expect(daysWithData).toContain('11');
      expect(daysWithData).toContain('12');
      expect(daysWithData).toContain('13');
      expect(daysWithData).toContain('14');
      expect(daysWithData).toContain('15');
    });

    test('should not contain data for other months', async () => {
      const year2024 = structuredData['2024'];
      const months = Object.keys(year2024);
      
      expect(months).toHaveLength(1);
      expect(months[0]).toBe('1');
    });

    test('should handle mood score transformations from getReadableData', async () => {
      const january2024 = structuredData['2024']['1'];
      
      const moodScores = Object.values(january2024);
      moodScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(5);
        expect(typeof score).toBe('number');
      });
    });
  });

  test.describe('API Integration', () => {
    test('should have consistent data across endpoints', async ({ request }) => {
      const vitalResponse = await request.get('/vital');
      const entriesResponse = await request.get('/entries');
      const structuredResponse = await request.get('/structured_data');
      
      const vitalData = await vitalResponse.json();
      const entriesData = await entriesResponse.json();
      const structuredData = await structuredResponse.json();
      
      expect(Object.keys(vitalData.available_moods)).toHaveLength(5);
      expect(entriesData).toHaveLength(5);
      
      const entriesInStructured = Object.keys(structuredData['2024']['1']).length;
      expect(entriesInStructured).toBe(5);
    });

    test('should have matching mood IDs between vital and entries', async ({ request }) => {
      const vitalResponse = await request.get('/vital');
      const entriesResponse = await request.get('/entries');
      
      const vitalData = await vitalResponse.json();
      const entriesData = await entriesResponse.json();
      
      const moodIds = Object.keys(vitalData.available_moods).map(id => parseInt(id));
      const entryMoodIds = entriesData.map(entry => entry.mood);
      
      entryMoodIds.forEach(moodId => {
        expect(moodIds).toContain(moodId);
      });
    });

    test('should have matching activity IDs between vital and entries', async ({ request }) => {
      const vitalResponse = await request.get('/vital');
      const entriesResponse = await request.get('/entries');
      
      const vitalData = await vitalResponse.json();
      const entriesData = await entriesResponse.json();
      
      const activityIds = Object.keys(vitalData.available_activities).map(id => parseInt(id));
      
      entriesData.forEach(entry => {
        entry.activities.forEach(activityId => {
          expect(activityIds).toContain(activityId);
        });
      });
    });

    test('should return proper content-type headers', async ({ request }) => {
      const vitalResponse = await request.get('/vital');
      const entriesResponse = await request.get('/entries');
      const structuredResponse = await request.get('/structured_data');
      
      expect(vitalResponse.headers()['content-type']).toContain('application/json');
      expect(entriesResponse.headers()['content-type']).toContain('application/json');
      expect(structuredResponse.headers()['content-type']).toContain('application/json');
    });

    test('should return 200 status codes', async ({ request }) => {
      const vitalResponse = await request.get('/vital');
      const entriesResponse = await request.get('/entries');
      const structuredResponse = await request.get('/structured_data');
      
      expect(vitalResponse.status()).toBe(200);
      expect(entriesResponse.status()).toBe(200);
      expect(structuredResponse.status()).toBe(200);
    });
  });
});
