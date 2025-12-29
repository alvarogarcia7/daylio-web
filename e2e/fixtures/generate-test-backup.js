const fs = require('fs');
const path = require('path');

const testData = {
  "version": 15,
  "daysInRowLongestChain": 3,
  "metadata": {
    "number_of_entries": 5
  },
  "customMoods": [
    {
      "id": 1,
      "custom_name": "rad",
      "mood_group_id": 5,
      "mood_group_order": 0,
      "icon_id": 1,
      "predefined_name_id": 1,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 2,
      "custom_name": "good",
      "mood_group_id": 4,
      "mood_group_order": 1,
      "icon_id": 2,
      "predefined_name_id": 2,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 3,
      "custom_name": "meh",
      "mood_group_id": 3,
      "mood_group_order": 2,
      "icon_id": 3,
      "predefined_name_id": 3,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 4,
      "custom_name": "bad",
      "mood_group_id": 2,
      "mood_group_order": 3,
      "icon_id": 4,
      "predefined_name_id": 4,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 5,
      "custom_name": "awful",
      "mood_group_id": 1,
      "mood_group_order": 4,
      "icon_id": 5,
      "predefined_name_id": 5,
      "state": 0,
      "createdAt": 1577836800000
    }
  ],
  "tag_groups": [
    {
      "id": 1,
      "name": "activities",
      "order": 0,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 2,
      "name": "people",
      "order": 1,
      "state": 0,
      "createdAt": 1577836800000
    }
  ],
  "tags": [
    {
      "id": 1,
      "name": "work",
      "id_tag_group": 1,
      "icon": "briefcase",
      "order": 0,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 2,
      "name": "exercise",
      "id_tag_group": 1,
      "icon": "running",
      "order": 1,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 3,
      "name": "reading",
      "id_tag_group": 1,
      "icon": "book",
      "order": 2,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 4,
      "name": "family",
      "id_tag_group": 2,
      "icon": "family",
      "order": 0,
      "state": 0,
      "createdAt": 1577836800000
    },
    {
      "id": 5,
      "name": "friends",
      "id_tag_group": 2,
      "icon": "friends",
      "order": 1,
      "state": 0,
      "createdAt": 1577836800000
    }
  ],
  "dayEntries": [
    {
      "id": 1,
      "minute": 0,
      "hour": 9,
      "day": 1,
      "month": 1,
      "year": 2024,
      "datetime": 1704099600000,
      "timeZoneOffset": 0,
      "mood": 1,
      "note_title": "Great Start",
      "note": "Started the new year with lots of energy",
      "tags": [1, 2]
    },
    {
      "id": 2,
      "minute": 30,
      "hour": 14,
      "day": 2,
      "month": 1,
      "year": 2024,
      "datetime": 1704205800000,
      "timeZoneOffset": 0,
      "mood": 2,
      "note_title": "Good Day",
      "note": "Had a productive day at work",
      "tags": [1, 3]
    },
    {
      "id": 3,
      "minute": 0,
      "hour": 20,
      "day": 3,
      "month": 1,
      "year": 2024,
      "datetime": 1704312000000,
      "timeZoneOffset": 0,
      "mood": 3,
      "note_title": "Average Day",
      "note": "Nothing special happened",
      "tags": [3]
    },
    {
      "id": 4,
      "minute": 15,
      "hour": 18,
      "day": 4,
      "month": 1,
      "year": 2024,
      "datetime": 1704391515000,
      "timeZoneOffset": 0,
      "mood": 2,
      "note_title": "Family Time",
      "note": "Spent quality time with family",
      "tags": [4, 5]
    },
    {
      "id": 5,
      "minute": 45,
      "hour": 10,
      "day": 5,
      "month": 1,
      "year": 2024,
      "datetime": 1704448500000,
      "timeZoneOffset": 0,
      "mood": 1,
      "note_title": "Amazing Morning",
      "note": "Morning workout felt great!\nReally energized",
      "tags": [2, 5]
    }
  ]
};

const jsonString = JSON.stringify(testData);
const base64Data = Buffer.from(jsonString, 'utf-8').toString('base64');

const outputPath = path.join(__dirname, 'test-backup.daylio');
fs.writeFileSync(outputPath, base64Data);

console.log('Test backup fixture created at:', outputPath);
