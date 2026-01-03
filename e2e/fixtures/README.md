# Test Fixtures

## test-backup.daylio

A minimal Daylio backup file for testing purposes. This file contains:

### Entries (5 total)
- **Jan 15, 2024 (14:00)** - "Great Day" - Mood: rad - Activities: work, friends
- **Jan 14, 2024 (09:30)** - "Good Morning" - Mood: good - Activities: exercise
- **Jan 13, 2024 (20:00)** - Regular day at work - Mood: meh - Activities: work
- **Jan 12, 2024 (18:15)** - "Stressful" - Mood: bad - Activities: work, stress
- **Jan 11, 2024 (22:00)** - "Rough Day" - Mood: awful - No activities

### Moods (5 levels)
1. rad (mood_group_id: 1)
2. good (mood_group_id: 2)
3. meh (mood_group_id: 3)
4. bad (mood_group_id: 4)
5. awful (mood_group_id: 5)

### Activities (4 total)
1. work (icon: briefcase, group: Work)
2. friends (icon: people, group: Social)
3. exercise (icon: sport, group: Health)
4. stress (icon: sad_2, group: Emotions)

### Activity Groups (4 total)
1. Work
2. Social
3. Health
4. Emotions

### Metadata
- Longest streak: 5 days
- Number of entries: 5

## Regenerating the fixture

To modify the test fixture, edit `create-test-backup.js` and run:
```bash
node e2e/fixtures/create-test-backup.js
```

The backup file is a base64-encoded JSON object with the Daylio backup format.
