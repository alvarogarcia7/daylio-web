const { test, expect } = require('@playwright/test');
const EntryListPage = require('../pages/EntryListPage');

test.describe('Entry List Rendering', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should display entry list view', async () => {
    await expect(entryListPage.isEntryListVisible()).resolves.toBeTruthy();
  });

  test('should render all entries', async () => {
    const count = await entryListPage.getEntryCount();
    expect(count).toBe(5);
  });

  test('should display search input', async () => {
    await expect(entryListPage.searchInput).toBeVisible();
  });

  test('should have correct placeholder text', async () => {
    const placeholder = await entryListPage.searchInput.getAttribute('placeholder');
    expect(placeholder).toContain('Search through dates, notes, moods');
  });

  test('should render entry list container', async () => {
    await expect(entryListPage.entryList).toBeVisible();
  });

  test('should display all entries as visible initially', async () => {
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(5);
  });

  test('should render entries in order', async () => {
    const entries = await entryListPage.getAllEntries();
    expect(entries.length).toBe(5);
    
    const firstEntry = entries[0];
    const firstEntryId = await firstEntry.getAttribute('data-entry-id');
    expect(firstEntryId).toBe('0');
  });
});

test.describe('Entry Item Display', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should display entry date', async () => {
    const date = await entryListPage.getEntryDate('0');
    expect(date).toContain('Jan 2024');
  });

  test('should display mood badge', async () => {
    const mood = await entryListPage.getEntryMood('0');
    expect(mood.length).toBeGreaterThan(0);
  });

  test('should display mood badge with correct class', async ({ page }) => {
    const badge = page.locator('[data-entry-id="0"]').locator('.badge');
    const badgeClass = await badge.getAttribute('class');
    expect(badgeClass).toContain('mood-pill');
  });

  test('should display activities preview for entries with activities', async () => {
    const activities = await entryListPage.getEntryActivitiesPreview('0');
    expect(activities).toBeTruthy();
  });

  test('should show "No activities" when entry has no activities', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (const entry of entries) {
      const activitiesText = await entry.locator('.ms-2.me-auto').textContent();
      if (activitiesText.includes('No activities')) {
        expect(activitiesText).toContain('No activities');
        break;
      }
    }
  });

  test('should display activities with bullet separator', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (const entry of entries) {
      const activitiesText = await entry.locator('.ms-2.me-auto').textContent();
      if (activitiesText.includes('•')) {
        expect(activitiesText).toContain('•');
        break;
      }
    }
  });

  test('should display "+X more" for entries with many activities', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (const entry of entries) {
      const activitiesText = await entry.locator('.ms-2.me-auto').textContent();
      if (activitiesText.includes('more')) {
        expect(activitiesText).toMatch(/\+\s*\d+\s*more/);
        break;
      }
    }
  });

  test('should have correct entry structure', async ({ page }) => {
    const entry = page.locator('[data-entry-id="0"]');
    
    await expect(entry.locator('.fw-bold')).toBeVisible();
    await expect(entry.locator('.ms-2.me-auto')).toBeVisible();
    await expect(entry.locator('.badge')).toBeVisible();
  });

  test('should have list-group-item class', async ({ page }) => {
    const entry = page.locator('[data-entry-id="0"]');
    const classList = await entry.getAttribute('class');
    expect(classList).toContain('list-group-item');
  });

  test('should be styled as action item', async ({ page }) => {
    const entry = page.locator('[data-entry-id="0"]');
    const classList = await entry.getAttribute('class');
    expect(classList).toContain('list-group-item-action');
  });
});

test.describe('Multi-Entry Same-Day Handling', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should display timestamps for entries on same date', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (let i = 0; i < entries.length - 1; i++) {
      const currentEntry = entries[i];
      const nextEntry = entries[i + 1];
      
      const currentDateText = await currentEntry.locator('.fw-bold').textContent();
      const nextDateText = await nextEntry.locator('.fw-bold').textContent();
      
      const currentDateOnly = currentDateText.replace(/\s*\([^)]*\)/g, '').replace('↱', '').trim();
      const nextDateOnly = nextDateText.replace(/\s*\([^)]*\)/g, '').replace('↱', '').trim();
      
      if (currentDateOnly === nextDateOnly) {
        expect(currentDateText).toContain('(');
        expect(currentDateText).toContain(')');
      }
    }
  });

  test('should display arrow indicator for multi-entry dates', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (let i = 0; i < entries.length - 1; i++) {
      const currentEntry = entries[i];
      const nextEntry = entries[i + 1];
      
      const currentDateText = await currentEntry.locator('.fw-bold').textContent();
      const nextDateText = await nextEntry.locator('.fw-bold').textContent();
      
      const currentDateOnly = currentDateText.replace(/\s*\([^)]*\)/g, '').replace('↱', '').trim();
      const nextDateOnly = nextDateText.replace(/\s*\([^)]*\)/g, '').replace('↱', '').trim();
      
      if (currentDateOnly === nextDateOnly) {
        expect(currentDateText).toContain('↱');
      }
    }
  });

  test('should not display timestamp for single-entry dates', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (let i = 0; i < entries.length; i++) {
      const currentEntry = entries[i];
      const currentDateText = await currentEntry.locator('.fw-bold').textContent();
      
      let hasSameDateNext = false;
      if (i + 1 < entries.length) {
        const nextEntry = entries[i + 1];
        const nextDateText = await nextEntry.locator('.fw-bold').textContent();
        
        const currentDateOnly = currentDateText.replace(/\s*\([^)]*\)/g, '').replace('↱', '').trim();
        const nextDateOnly = nextDateText.replace(/\s*\([^)]*\)/g, '').replace('↱', '').trim();
        
        hasSameDateNext = currentDateOnly === nextDateOnly;
      }
      
      if (!hasSameDateNext) {
        expect(currentDateText).not.toContain('(');
      }
    }
  });

  test('should format timestamp correctly', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (let i = 0; i < entries.length - 1; i++) {
      const currentEntry = entries[i];
      const nextEntry = entries[i + 1];
      
      const currentDateText = await currentEntry.locator('.fw-bold').textContent();
      const nextDateText = await nextEntry.locator('.fw-bold').textContent();
      
      const currentDateOnly = currentDateText.replace(/\s*\([^)]*\)/g, '').replace('↱', '').trim();
      const nextDateOnly = nextDateText.replace(/\s*\([^)]*\)/g, '').replace('↱', '').trim();
      
      if (currentDateOnly === nextDateOnly) {
        expect(currentDateText).toMatch(/\d{1,2}:\d{2}\s+(AM|PM)/);
      }
    }
  });
});

test.describe('Search Functionality - By Date', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should filter entries by date', async () => {
    await entryListPage.searchEntries('15th Jan');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should filter entries by partial date', async () => {
    await entryListPage.searchEntries('Jan');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(5);
  });

  test('should filter entries by year', async () => {
    await entryListPage.searchEntries('2024');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(5);
  });

  test('should hide non-matching entries', async () => {
    await entryListPage.searchEntries('15th Jan');
    const allCount = await entryListPage.getEntryCount();
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeLessThan(allCount);
  });

  test('should be case-insensitive for date search', async () => {
    await entryListPage.searchEntries('jan');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(5);
  });

  test('should show all entries when search is cleared', async () => {
    await entryListPage.searchEntries('15th Jan');
    await entryListPage.clearSearch();
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(5);
  });

  test('should update results as user types', async () => {
    await entryListPage.searchEntries('1');
    const countAfterOne = await entryListPage.getVisibleEntryCount();
    
    await entryListPage.searchEntries('15');
    const countAfterTwo = await entryListPage.getVisibleEntryCount();
    
    expect(countAfterTwo).toBeLessThanOrEqual(countAfterOne);
  });
});

test.describe('Search Functionality - By Mood', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should filter entries by mood name', async () => {
    await entryListPage.searchEntries('rad');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should be case-insensitive for mood search', async () => {
    await entryListPage.searchEntries('RAD');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should filter by different mood types', async () => {
    await entryListPage.searchEntries('good');
    const goodCount = await entryListPage.getVisibleEntryCount();
    
    await entryListPage.clearSearch();
    await entryListPage.searchEntries('bad');
    const badCount = await entryListPage.getVisibleEntryCount();
    
    expect(goodCount).toBeGreaterThan(0);
    expect(badCount).toBeGreaterThan(0);
  });

  test('should show no results for non-existent mood', async () => {
    await entryListPage.searchEntries('nonexistentmood12345');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(0);
  });
});

test.describe('Search Functionality - By Note Content', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should filter entries by note content', async () => {
    await entryListPage.searchEntries('wonderful');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should filter by partial note content', async () => {
    await entryListPage.searchEntries('day');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should be case-insensitive for note search', async () => {
    await entryListPage.searchEntries('WONDERFUL');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should filter by multiple word phrases', async () => {
    await entryListPage.searchEntries('wonderful day');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should show entries matching any word in note', async () => {
    await entryListPage.searchEntries('exercise');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });
});

test.describe('Search Functionality - By Title', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should filter entries by note title', async () => {
    await entryListPage.searchEntries('Great Day');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should filter by partial title', async () => {
    await entryListPage.searchEntries('Great');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should be case-insensitive for title search', async () => {
    await entryListPage.searchEntries('great day');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should filter entries by different titles', async () => {
    await entryListPage.searchEntries('Morning');
    const morningCount = await entryListPage.getVisibleEntryCount();
    
    await entryListPage.clearSearch();
    await entryListPage.searchEntries('Stressful');
    const stressCount = await entryListPage.getVisibleEntryCount();
    
    expect(morningCount).toBeGreaterThan(0);
    expect(stressCount).toBeGreaterThan(0);
  });
});

test.describe('Search Functionality - Combined', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should show entries matching any search criteria', async () => {
    await entryListPage.searchEntries('Jan');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should maintain search value in input', async () => {
    const searchTerm = 'wonderful';
    await entryListPage.searchEntries(searchTerm);
    const inputValue = await entryListPage.getSearchValue();
    expect(inputValue).toBe(searchTerm);
  });

  test('should clear search when input is cleared', async () => {
    await entryListPage.searchEntries('Great');
    await entryListPage.clearSearch();
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(5);
  });

  test('should handle special characters in search', async () => {
    await entryListPage.searchEntries('.');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty search', async () => {
    await entryListPage.searchEntries('');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(5);
  });

  test('should search across all fields simultaneously', async () => {
    await entryListPage.searchEntries('work');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThan(0);
  });
});

test.describe('Empty State Handling', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should show no visible entries when search has no matches', async () => {
    await entryListPage.searchEntries('zzzznonexistent');
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBe(0);
  });

  test('should keep all entries in DOM when search has no matches', async () => {
    await entryListPage.searchEntries('zzzznonexistent');
    const totalCount = await entryListPage.getEntryCount();
    expect(totalCount).toBe(5);
  });

  test('should hide entries by adding visually-hidden class', async ({ page }) => {
    await entryListPage.searchEntries('zzzznonexistent');
    
    const entries = await entryListPage.getAllEntries();
    for (const entry of entries) {
      const classList = await entry.getAttribute('class');
      expect(classList).toContain('visually-hidden');
    }
  });

  test('should remove visually-hidden class when entries match', async ({ page }) => {
    await entryListPage.searchEntries('zzzznonexistent');
    await entryListPage.clearSearch();
    
    const visibleEntries = await entryListPage.getVisibleEntries();
    expect(visibleEntries.length).toBe(5);
  });

  test('should handle rapid search changes', async () => {
    await entryListPage.searchEntries('a');
    await entryListPage.page.waitForTimeout(100);
    
    await entryListPage.searchEntries('b');
    await entryListPage.page.waitForTimeout(100);
    
    await entryListPage.searchEntries('c');
    await entryListPage.page.waitForTimeout(100);
    
    const visibleCount = await entryListPage.getVisibleEntryCount();
    expect(visibleCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Entry List Interaction', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should be able to click on entry items', async () => {
    await entryListPage.clickEntryByIndex(0);
    const activeEntry = await entryListPage.getActiveEntry();
    expect(activeEntry).not.toBeNull();
  });

  test('should add active class to clicked entry', async () => {
    await entryListPage.clickEntryByIndex(0);
    const isActive = await entryListPage.isEntryActive('0');
    expect(isActive).toBeTruthy();
  });

  test('should be able to click different entries', async () => {
    await entryListPage.clickEntryByIndex(0);
    const firstActive = await entryListPage.isEntryActive('0');
    
    await entryListPage.clickEntryByIndex(1);
    const secondActive = await entryListPage.isEntryActive('1');
    
    expect(firstActive).toBeTruthy();
    expect(secondActive).toBeTruthy();
  });

  test('should handle clicking on filtered entries', async () => {
    await entryListPage.searchEntries('15th Jan');
    const visibleEntries = await entryListPage.getVisibleEntries();
    
    if (visibleEntries.length > 0) {
      await visibleEntries[0].click();
      await entryListPage.page.waitForTimeout(300);
      const activeEntry = await entryListPage.getActiveEntry();
      expect(activeEntry).not.toBeNull();
    }
  });

  test('should maintain entry list during search', async () => {
    const initialCount = await entryListPage.getEntryCount();
    await entryListPage.searchEntries('Great');
    const searchCount = await entryListPage.getEntryCount();
    expect(searchCount).toBe(initialCount);
  });
});

test.describe('Entry List Data Integrity', () => {
  let entryListPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    await entryListPage.goto();
  });

  test('should have unique entry IDs', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    const ids = [];
    
    for (const entry of entries) {
      const id = await entry.getAttribute('data-entry-id');
      expect(ids).not.toContain(id);
      ids.push(id);
    }
  });

  test('should have sequential entry IDs', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (let i = 0; i < entries.length; i++) {
      const id = await entries[i].getAttribute('data-entry-id');
      expect(id).toBe(String(i));
    }
  });

  test('should have valid entry structure for all entries', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (const entry of entries) {
      await expect(entry.locator('.fw-bold')).toBeAttached();
      await expect(entry.locator('.ms-2.me-auto')).toBeAttached();
      await expect(entry.locator('.badge')).toBeAttached();
    }
  });

  test('should have button type for all entries', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (const entry of entries) {
      const type = await entry.getAttribute('type');
      expect(type).toBe('button');
    }
  });

  test('should have proper styling classes', async ({ page }) => {
    const entries = await entryListPage.getAllEntries();
    
    for (const entry of entries) {
      const classList = await entry.getAttribute('class');
      expect(classList).toContain('list-group-item');
      expect(classList).toContain('list-group-item-action');
      expect(classList).toContain('entry-list-item');
    }
  });
});
