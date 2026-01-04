# Test Fixtures

This directory contains test data fixtures for E2E testing.

## Files

### test-backup.daylio
A minimal Daylio backup file containing known test data. This file is base64-encoded and follows the Daylio backup format.

### generate-test-backup.js
Script to generate the test-backup.daylio file. Run this script whenever you need to update the test data.

## Test Data Structure

The test backup contains carefully crafted data to test various features:

### Moods (5 moods covering all mood groups)
- **rad** - mood_group_id: 5 (highest)
- **good** - mood_group_id: 4
- **meh** - mood_group_id: 3 (neutral)
- **bad** - mood_group_id: 2
- **awful** - mood_group_id: 1 (lowest)

### Tag Groups (2 groups)
1. **activities** - General daily activities
2. **people** - Social interactions

### Tags (5 tags)
**Activities group:**
- work (briefcase icon)
- exercise (running icon)
- reading (book icon)

**People group:**
- family (family icon)
- friends (friends icon)

### Day Entries (5 entries in January 2024)

#### Entry 1 - January 1, 2024 09:00
- Mood: rad
- Title: "Great Start"
- Note: "Started the new year with lots of energy"
- Tags: work, exercise

#### Entry 2 - January 2, 2024 14:30
- Mood: good
- Title: "Good Day"
- Note: "Had a productive day at work"
- Tags: work, reading

#### Entry 3 - January 3, 2024 20:00
- Mood: meh
- Title: "Average Day"
- Note: "Nothing special happened"
- Tags: reading

#### Entry 4 - January 4, 2024 18:15
- Mood: good
- Title: "Family Time"
- Note: "Spent quality time with family"
- Tags: family, friends

#### Entry 5 - January 5, 2024 10:45
- Mood: rad
- Title: "Amazing Morning"
- Note: "Morning workout felt great!\nReally energized" (multi-line)
- Tags: exercise, friends

### Metadata
- version: 15
- daysInRowLongestChain: 3
- number_of_entries: 5

## Modifying Test Data

To modify the test data:

1. Edit the `testData` object in `generate-test-backup.js`
2. Run: `node generate-test-backup.js`
3. The updated `test-backup.daylio` will be created
4. Update tests if the data structure changes

## Data Characteristics

This test dataset is designed to test:
- Multiple mood levels (all 5)
- Multiple tag groups and tags
- Various activity combinations
- Multi-line notes (Entry 5)
- Different times of day
- Consecutive days (for streak testing)
- Date formatting and display
