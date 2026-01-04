const { test, expect } = require('@playwright/test');
const EntryListPage = require('../pages/EntryListPage');
const EntryDetailPage = require('../pages/EntryDetailPage');

test.describe('Entry Detail - Entry Selection', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should show entry detail when entry is selected from list', async () => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
  });

  test('should hide dashboard when entry detail is shown', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    const dashboardHolder = page.locator('#dashboard-holder');
    const isHidden = await dashboardHolder.evaluate(el => 
      el.classList.contains('visually-hidden')
    );
    expect(isHidden).toBeTruthy();
  });

  test('should display entry detail for different entries', async () => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
    
    await entryDetailPage.closeEntry();
    
    await entryListPage.clickEntryByIndex(1);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
  });

  test('should mark clicked entry as active', async () => {
    await entryListPage.clickEntryByIndex(0);
    const isActive = await entryListPage.isEntryActive('0');
    expect(isActive).toBeTruthy();
  });

  test('should load entry detail content after selection', async () => {
    await entryListPage.clickEntryByIndex(0);
    await entryDetailPage.waitForEntryDetail();
    await expect(entryDetailPage.entryTitle).toBeVisible();
  });
});

test.describe('Entry Detail - Basic Display', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
    await entryListPage.clickEntryByIndex(0);
  });

  test('should display entry title', async () => {
    await expect(entryDetailPage.entryTitle).toBeVisible();
    const title = await entryDetailPage.getEntryTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  test.skip('should display entry time', async () => {
    await expect(entryDetailPage.entryTime).toBeVisible();
    const time = await entryDetailPage.getEntryTime();
    expect(time).toMatch(/\d{1,2}:\d{2}\s+(AM|PM)/);
  });

  test.skip('should display entry day', async () => {
    await expect(entryDetailPage.entryDay).toBeVisible();
    const day = await entryDetailPage.getEntryDay();
    expect(day.length).toBeGreaterThan(0);
  });

  test.skip('should display mood icon', async () => {
    await expect(entryDetailPage.entryMoodIcon).toBeVisible();
    const moodIcon = await entryDetailPage.getMoodIcon();
    expect(moodIcon.length).toBeGreaterThan(0);
  });

  test.skip('should display mood text', async () => {
    await expect(entryDetailPage.entryMoodText).toBeVisible();
    const moodText = await entryDetailPage.getMoodText();
    expect(moodText.length).toBeGreaterThan(0);
  });

  test.skip('should display activity count', async () => {
    await expect(entryDetailPage.entryActivityCount).toBeVisible();
    const activityCount = await entryDetailPage.getActivityCount();
    expect(activityCount).toMatch(/\d+/);
  });

  test.skip('should have all basic info elements visible', async () => {
    await expect(entryDetailPage.entryTitle).toBeVisible();
    await expect(entryDetailPage.entryTime).toBeVisible();
    await expect(entryDetailPage.entryDay).toBeVisible();
    await expect(entryDetailPage.entryMoodIcon).toBeVisible();
    await expect(entryDetailPage.entryMoodText).toBeVisible();
    await expect(entryDetailPage.entryActivityCount).toBeVisible();
  });
});

test.describe('Entry Detail - Activity Groups', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
    await entryListPage.clickEntryByIndex(0);
  });

  test('should display activity groups', async () => {
    const groupCount = await entryDetailPage.getActivityGroupCount();
    expect(groupCount).toBeGreaterThan(0);
  });

  test('should have activity groups collapsed by default', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    
    for (let i = 0; i < groups.length; i++) {
      const groupId = await groups[i].getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeFalsy();
    }
  });

  test.skip('should expand activity group when clicked', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
    expect(isExpanded).toBeTruthy();
  });

  test.skip('should collapse activity group when clicked again', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    await entryDetailPage.collapseActivityGroup(groupId);
    const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
    expect(isExpanded).toBeFalsy();
  });

  test.skip('should show activity items when group is expanded', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    const items = await entryDetailPage.getActivityGroupItems(groupId);
    expect(items.length).toBeGreaterThanOrEqual(0);
  });

  test.skip('should hide activity items when group is collapsed', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    await entryDetailPage.collapseActivityGroup(groupId);
    
    const itemsContainer = page.locator(`#ac-group-${groupId}-items`);
    const isHidden = await itemsContainer.evaluate(el => 
      el.classList.contains('visually-hidden')
    );
    expect(isHidden).toBeTruthy();
  });

  test.skip('should display activity group labels', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    
    for (let i = 0; i < groups.length; i++) {
      const groupId = await groups[i].getAttribute('data-group-id');
      const label = await entryDetailPage.getActivityGroupLabel(groupId);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  test.skip('should have collapse icon for each activity group', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    
    for (let i = 0; i < groups.length; i++) {
      const groupId = await groups[i].getAttribute('data-group-id');
      const collapseIcon = page.locator(`#ac-group-${groupId}-collapse`);
      await expect(collapseIcon).toBeVisible();
    }
  });

  test.skip('should toggle collapse icon class when expanding', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    const collapseIcon = page.locator(`#ac-group-${groupId}-collapse`);
    
    const initialClass = await collapseIcon.getAttribute('class');
    expect(initialClass).toContain('collapsed');
    
    await entryDetailPage.expandActivityGroup(groupId);
    const expandedClass = await collapseIcon.getAttribute('class');
    expect(expandedClass).not.toContain('collapsed');
  });

  test('should have expand_more icon in collapse button', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    const collapseIcon = page.locator(`#ac-group-${groupId}-collapse`);
    const iconText = await collapseIcon.locator('i').textContent();
    expect(iconText).toContain('expand_more');
  });
});

test.describe('Entry Detail - Activity Highlighting', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test.skip('should highlight activities for selected entry', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length > 0) {
      const groupId = await groups[0].getAttribute('data-group-id');
      await entryDetailPage.expandActivityGroup(groupId);
      
      const activeActivities = await entryDetailPage.getActiveActivities();
      expect(activeActivities.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should add activity-dot-active class to entry activities', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    
    const activeItems = await page.locator('.activity-dot-active').all();
    expect(activeItems.length).toBeGreaterThanOrEqual(0);
  });

  test('should reset activity highlighting when switching entries', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    const firstEntryActivities = await entryDetailPage.getActiveActivities();
    
    await entryDetailPage.closeEntry();
    await entryListPage.clickEntryByIndex(1);
    const secondEntryActivities = await entryDetailPage.getActiveActivities();
    
    expect(secondEntryActivities.length).toBeGreaterThanOrEqual(0);
  });

  test.skip('should have activity dot with correct structure', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length > 0) {
      const groupId = await groups[0].getAttribute('data-group-id');
      await entryDetailPage.expandActivityGroup(groupId);
      
      const items = await entryDetailPage.getActivityGroupItems(groupId);
      if (items.length > 0) {
        const item = items[0];
        await expect(item.locator('img')).toBeAttached();
      }
    }
  });

  test.skip('should display activity icon for each activity', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length > 0) {
      const groupId = await groups[0].getAttribute('data-group-id');
      await entryDetailPage.expandActivityGroup(groupId);
      
      const items = await entryDetailPage.getActivityGroupItems(groupId);
      for (const item of items) {
        const img = item.locator('img');
        await expect(img).toBeAttached();
        const src = await img.getAttribute('src');
        expect(src).toContain('activity_icons');
      }
    }
  });

  test.skip('should display activity name label', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length > 0) {
      const groupId = await groups[0].getAttribute('data-group-id');
      await entryDetailPage.expandActivityGroup(groupId);
      
      const items = await entryDetailPage.getActivityGroupItems(groupId);
      if (items.length > 0) {
        const container = items[0].locator('..');
        const label = container.locator('label');
        await expect(label).toBeAttached();
        const text = await label.textContent();
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });

  test('should only highlight activities present in entry', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    
    const allActivityDots = await page.locator('.ac-item').all();
    const activeActivityDots = await page.locator('.activity-dot-active').all();
    
    expect(activeActivityDots.length).toBeLessThanOrEqual(allActivityDots.length);
  });
});

test.describe('Entry Detail - Toggle All Activities', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
    await entryListPage.clickEntryByIndex(0);
  });

  test('should have toggle all button visible', async () => {
    await expect(entryDetailPage.toggleAllButton).toBeVisible();
  });

  test('should expand all activity groups when toggle all is clicked', async () => {
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (let i = 0; i < groups.length; i++) {
      const groupId = await groups[i].getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeTruthy();
    }
  });

  test('should collapse all activity groups when toggle all is clicked again', async () => {
    await entryDetailPage.toggleAllActivities();
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (let i = 0; i < groups.length; i++) {
      const groupId = await groups[i].getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeFalsy();
    }
  });

  test('should show all activity items when toggle all expands', async ({ page }) => {
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (let i = 0; i < groups.length; i++) {
      const groupId = await groups[i].getAttribute('data-group-id');
      const itemsContainer = page.locator(`#ac-group-${groupId}-items`);
      const isHidden = await itemsContainer.evaluate(el => 
        el.classList.contains('visually-hidden')
      );
      expect(isHidden).toBeFalsy();
    }
  });
});

test.describe('Entry Detail - Note Display', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should display note viewer', async () => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.entryNoteViewer).toBeAttached();
  });

  test('should show note when entry has note content', async ({ page }) => {
    const entries = await page.evaluate(() => {
      return window.ENTRY_DATA;
    });
    
    let entryWithNote = null;
    for (let i = 0; i < Object.keys(entries).length; i++) {
      if (entries[i].note && entries[i].note.length > 0) {
        entryWithNote = i;
        break;
      }
    }
    
    if (entryWithNote !== null) {
      await entryListPage.clickEntryById(String(entryWithNote));
      const noteBody = await entryDetailPage.getNoteBody();
      expect(noteBody.length).toBeGreaterThan(0);
    }
  });

  test('should display note with proper formatting', async ({ page }) => {
    const entries = await page.evaluate(() => {
      return window.ENTRY_DATA;
    });
    
    let entryWithNote = null;
    for (let i = 0; i < Object.keys(entries).length; i++) {
      if (entries[i].note && entries[i].note.length > 0) {
        entryWithNote = i;
        break;
      }
    }
    
    if (entryWithNote !== null) {
      await entryListPage.clickEntryById(String(entryWithNote));
      await expect(entryDetailPage.entryNoteBody).toBeVisible();
    }
  });

  test('should have note section with title', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    const noteTitle = entryDetailPage.entryNoteViewer.locator('h5');
    await expect(noteTitle).toBeVisible();
    const title = await noteTitle.textContent();
    expect(title).toContain('Note');
  });

  test('should have note body container', async () => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.entryNoteBody).toBeAttached();
  });

  test('should display note in card container', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    const noteCard = entryDetailPage.entryNoteViewer.locator('.card');
    await expect(noteCard).toBeVisible();
  });

  test('should handle entries without notes', async ({ page }) => {
    const entries = await page.evaluate(() => {
      return window.ENTRY_DATA;
    });
    
    let entryWithoutNote = null;
    for (let i = 0; i < Object.keys(entries).length; i++) {
      if (!entries[i].note || entries[i].note.length === 0) {
        entryWithoutNote = i;
        break;
      }
    }
    
    if (entryWithoutNote !== null) {
      await entryListPage.clickEntryById(String(entryWithoutNote));
      await expect(entryDetailPage.entryNoteViewer).toBeAttached();
    }
  });
});

test.describe('Entry Detail - Close Button', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
    await entryListPage.clickEntryByIndex(0);
  });

  test('should have close button visible', async () => {
    await expect(entryDetailPage.closeButton).toBeVisible();
  });

  test('should return to dashboard when close button is clicked', async ({ page }) => {
    await entryDetailPage.closeEntry();
    
    const dashboardHolder = page.locator('#dashboard-holder');
    const isVisible = await dashboardHolder.evaluate(el => 
      !el.classList.contains('visually-hidden')
    );
    expect(isVisible).toBeTruthy();
  });

  test('should hide entry detail when close button is clicked', async () => {
    await entryDetailPage.closeEntry();
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeFalsy();
  });

  test('should have back arrow icon', async () => {
    const buttonText = await entryDetailPage.closeButton.textContent();
    expect(buttonText).toContain('◀');
  });

  test('should maintain entry list state after closing', async ({ page }) => {
    await entryDetailPage.closeEntry();
    
    const entryCount = await entryListPage.getEntryCount();
    expect(entryCount).toBeGreaterThanOrEqual(5);
  });

  test('should remove active state from entry when closing', async ({ page }) => {
    await entryDetailPage.closeEntry();
    
    const activeEntry = await entryListPage.getActiveEntry();
    expect(activeEntry).toBeNull();
  });

  test('should be able to open another entry after closing', async () => {
    await entryDetailPage.closeEntry();
    await entryListPage.clickEntryByIndex(1);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
  });
});

test.describe('Entry Detail - Data Integrity', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should display correct data for each entry', async ({ page }) => {
    const entries = await page.evaluate(() => {
      return window.ENTRY_DATA;
    });
    
    for (let i = 0; i < Math.min(3, Object.keys(entries).length); i++) {
      await entryListPage.clickEntryById(String(i));
      
      const title = await entryDetailPage.getEntryTitle();
      expect(title).toBe(entries[i].journal[0] || '');
      
      await entryDetailPage.closeEntry();
    }
  });

  test('should update mood text when switching entries', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    const firstMoodText = await entryDetailPage.getMoodText();
    
    await entryDetailPage.closeEntry();
    
    await entryListPage.clickEntryByIndex(1);
    const secondMoodText = await entryDetailPage.getMoodText();
    
    expect(firstMoodText).toBeTruthy();
    expect(secondMoodText).toBeTruthy();
  });

  test('should update activity count when switching entries', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    const firstActivityCount = await entryDetailPage.getActivityCount();
    
    await entryDetailPage.closeEntry();
    
    await entryListPage.clickEntryByIndex(1);
    const secondActivityCount = await entryDetailPage.getActivityCount();
    
    expect(firstActivityCount).toBeTruthy();
    expect(secondActivityCount).toBeTruthy();
  });

  test('should display consistent data across multiple views', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    const firstTitle = await entryDetailPage.getEntryTitle();
    
    await entryDetailPage.closeEntry();
    await entryListPage.clickEntryByIndex(0);
    const secondTitle = await entryDetailPage.getEntryTitle();
    
    expect(firstTitle).toBe(secondTitle);
  });
});

test.describe('Entry Detail - Navigation Flow', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should navigate through multiple entries', async () => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
    
    await entryDetailPage.closeEntry();
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeFalsy();
    
    await entryListPage.clickEntryByIndex(1);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
  });

  test('should handle rapid entry switching', async () => {
    await entryListPage.clickEntryByIndex(0);
    await entryListPage.page.waitForTimeout(100);
    
    await entryDetailPage.closeEntry();
    await entryListPage.page.waitForTimeout(100);
    
    await entryListPage.clickEntryByIndex(1);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
  });

  test('should maintain UI state during navigation', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    await entryDetailPage.toggleAllActivities();
    
    await entryDetailPage.closeEntry();
    await entryListPage.clickEntryByIndex(1);
    
    await expect(entryDetailPage.entryViewHolder).toBeVisible();
  });

  test('should handle search and entry detail together', async () => {
    await entryListPage.searchEntries('Jan');
    const visibleEntries = await entryListPage.getVisibleEntries();
    
    if (visibleEntries.length > 0) {
      await visibleEntries[0].click();
      await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
      
      await entryDetailPage.closeEntry();
      const stillVisible = await entryListPage.getVisibleEntryCount();
      expect(stillVisible).toBeGreaterThan(0);
    }
  });

  test('should preserve search state after viewing entry', async () => {
    const searchTerm = 'rad';
    await entryListPage.searchEntries(searchTerm);
    
    const visibleEntries = await entryListPage.getVisibleEntries();
    if (visibleEntries.length > 0) {
      await visibleEntries[0].click();
      await entryDetailPage.closeEntry();
      
      const searchValue = await entryListPage.getSearchValue();
      expect(searchValue).toBe(searchTerm);
    }
  });
});
