const fs = require('fs');
const path = require('path');

const testData = {
  version: 22,
  dayEntries: [
    {
      id: 1,
      minute: 0,
      hour: 14,
      day: 15,
      month: 1,
      year: 2024,
      datetime: 1705327200000,
      timeZoneOffset: 0,
      mood: 1,
      note_title: "Great Day",
      note: "Had a wonderful day with friends.",
      tags: [1, 2],
      tag_ids: null
    },
    {
      id: 2,
      minute: 30,
      hour: 9,
      day: 14,
      month: 1,
      year: 2024,
      datetime: 1705224600000,
      timeZoneOffset: 0,
      mood: 2,
      note_title: "Good Morning",
      note: "Started the day with exercise.",
      tags: [3],
      tag_ids: null
    },
    {
      id: 3,
      minute: 0,
      hour: 20,
      day: 13,
      month: 1,
      year: 2024,
      datetime: 1705176000000,
      timeZoneOffset: 0,
      mood: 3,
      note_title: "",
      note: "Regular day at work.",
      tags: [1],
      tag_ids: null
    },
    {
      id: 4,
      minute: 15,
      hour: 18,
      day: 12,
      month: 1,
      year: 2024,
      datetime: 1705083300000,
      timeZoneOffset: 0,
      mood: 4,
      note_title: "Stressful",
      note: "Too many deadlines.",
      tags: [1, 4],
      tag_ids: null
    },
    {
      id: 5,
      minute: 0,
      hour: 22,
      day: 11,
      month: 1,
      year: 2024,
      datetime: 1705010400000,
      timeZoneOffset: 0,
      mood: 5,
      note_title: "Rough Day",
      note: "Everything went wrong.",
      tags: [],
      tag_ids: null
    }
  ],
  customMoods: [
    {
      id: 1,
      custom_name: "rad",
      mood_group_id: 1,
      mood_group_order: 0,
      icon_id: "happy",
      predefined_name_id: "rad"
    },
    {
      id: 2,
      custom_name: "good",
      mood_group_id: 2,
      mood_group_order: 1,
      icon_id: "slightly_happy",
      predefined_name_id: "good"
    },
    {
      id: 3,
      custom_name: "meh",
      mood_group_id: 3,
      mood_group_order: 2,
      icon_id: "neutral",
      predefined_name_id: "meh"
    },
    {
      id: 4,
      custom_name: "bad",
      mood_group_id: 4,
      mood_group_order: 3,
      icon_id: "slightly_sad",
      predefined_name_id: "bad"
    },
    {
      id: 5,
      custom_name: "awful",
      mood_group_id: 5,
      mood_group_order: 4,
      icon_id: "sad",
      predefined_name_id: "awful"
    }
  ],
  tags: [
    {
      id: 1,
      name: "work",
      created_at: 1704067200000,
      icon: "briefcase",
      order: 0,
      id_tag_group: 1,
      state: 1
    },
    {
      id: 2,
      name: "friends",
      created_at: 1704067200000,
      icon: "people",
      order: 1,
      id_tag_group: 2,
      state: 1
    },
    {
      id: 3,
      name: "exercise",
      created_at: 1704067200000,
      icon: "sport",
      order: 2,
      id_tag_group: 3,
      state: 1
    },
    {
      id: 4,
      name: "stress",
      created_at: 1704067200000,
      icon: "sad_2",
      order: 3,
      id_tag_group: 4,
      state: 1
    }
  ],
  tag_groups: [
    {
      id: 1,
      name: "Work",
      order: 0
    },
    {
      id: 2,
      name: "Social",
      order: 1
    },
    {
      id: 3,
      name: "Health",
      order: 2
    },
    {
      id: 4,
      name: "Emotions",
      order: 3
    }
  ],
  daysInRowLongestChain: 5,
  metadata: {
    number_of_entries: 5,
    created_at: 1704067200000,
    modified_at: 1705327200000
  }
};

const base64Data = Buffer.from(JSON.stringify(testData)).toString('base64');
const outputPath = path.join(__dirname, 'test-backup.daylio');
fs.writeFileSync(outputPath, base64Data);

console.log('Test backup created at:', outputPath);
