const { expect } = require('@playwright/test');
const DaylioPage = require('./DaylioPage');

class EntryListPage extends DaylioPage {
  constructor(page) {
    super(page);
    
    this.entryListView = page.locator('.entrylist-view, #entry-list-view');
    this.searchInput = page.locator('#entry-search');
    this.entryList = page.locator('#entry-list-view');
    this.entryItems = page.locator('.entry-list-item');
    this.entryListItems = page.locator('.entry-list-item');
  }

  async isEntryListVisible() {
    return await this.entryListView.isVisible();
  }

  async searchEntries(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(300);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  async getSearchValue() {
    return await this.searchInput.inputValue();
  }

  async getVisibleEntries() {
    const allEntries = await this.entryItems.all();
    const visibleEntries = [];
    
    for (const entry of allEntries) {
      const isHidden = await entry.evaluate(el => 
        el.classList.contains('visually-hidden')
      );
      if (!isHidden) {
        visibleEntries.push(entry);
      }
    }
    
    return visibleEntries;
  }

  async getAllEntries() {
    return await this.entryItems.all();
  }

  async getEntryCount() {
    return await this.entryItems.count();
  }

  async getVisibleEntryCount() {
    const items = await this.entryListItems.all();
    let count = 0;
    for (const item of items) {
      const classes = await item.getAttribute('class');
      if (!classes.includes('visually-hidden')) {
        count++;
      }
    }
    return count;
  }

  async clickEntry(index) {
    await this.entryListItems.nth(index).click();
  }

  async clickEntryByIndex(index) {
    const entry = this.entryItems.nth(index);
    await entry.click();
    await this.page.waitForTimeout(300);
  }

  async clickEntryById(entryId) {
    const entry = this.page.locator(`[data-entry-id="${entryId}"]`);
    await entry.click();
    await this.page.waitForTimeout(300);
  }

  async getEntryByIndex(index) {
    return this.entryItems.nth(index);
  }

  async getEntryDataById(entryId) {
    const entry = this.page.locator(`[data-entry-id="${entryId}"]`);
    const dateText = await entry.locator('.fw-bold').textContent();
    const activitiesText = await entry.locator('.ms-2.me-auto').locator('text=/.*•.*/').textContent().catch(() => 'No activities');
    const moodBadge = await entry.locator('.badge').textContent();
    
    return {
      date: dateText,
      activities: activitiesText,
      mood: moodBadge
    };
  }

  async getActiveEntry() {
    const activeEntry = this.page.locator('.entry-list-item.active');
    const count = await activeEntry.count();
    
    if (count === 0) {
      return null;
    }
    
    return activeEntry;
  }

  async isEntryActive(entryId) {
    const entry = this.page.locator(`[data-entry-id="${entryId}"]`);
    return await entry.evaluate(el => el.classList.contains('active'));
  }

  async verifyEntryActive(index) {
    const entry = this.entryListItems.nth(index);
    await expect(entry).toHaveClass(/active/);
  }

  async verifyNoEntryActive() {
    const activeEntries = this.entryListItems.filter({ hasClass: 'active' });
    await expect(activeEntries).toHaveCount(0);
  }

  async getEntryDate(indexOrEntryId) {
    if (typeof indexOrEntryId === 'number') {
      const entry = this.entryListItems.nth(indexOrEntryId);
      const dateElement = entry.locator('.fw-bold');
      return await dateElement.textContent();
    } else {
      const entry = this.page.locator(`[data-entry-id="${indexOrEntryId}"]`);
      return await entry.locator('.fw-bold').textContent();
    }
  }

  async getEntryMood(indexOrEntryId) {
    if (typeof indexOrEntryId === 'number') {
      const entry = this.entryListItems.nth(indexOrEntryId);
      const moodBadge = entry.locator('.badge.rounded-pill');
      return await moodBadge.textContent();
    } else {
      const entry = this.page.locator(`[data-entry-id="${indexOrEntryId}"]`);
      return await entry.locator('.badge').textContent();
    }
  }

  async getEntryActivities(index) {
    const entry = this.entryListItems.nth(index);
    const activitiesElement = entry.locator('.ms-2.me-auto');
    const text = await activitiesElement.textContent();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    return lines.length > 1 ? lines[1] : '';
  }

  async getEntryActivitiesPreview(entryId) {
    const entry = this.page.locator(`[data-entry-id="${entryId}"]`);
    const container = entry.locator('.ms-2.me-auto');
    const lines = await container.locator('text=/[^\\n]+/').allTextContents();
    
    return lines.length > 1 ? lines[1] : 'No activities';
  }

  async searchAndVerifyResults(query, expectedCount) {
    await this.searchEntries(query);
    await this.page.waitForTimeout(300);
    const visibleCount = await this.getVisibleEntryCount();
    expect(visibleCount).toBe(expectedCount);
  }

  async verifyAllEntriesVisible() {
    const total = await this.getEntryCount();
    const visible = await this.getVisibleEntryCount();
    expect(visible).toBe(total);
  }

  async getFirstVisibleEntryIndex() {
    const items = await this.entryListItems.all();
    for (let i = 0; i < items.length; i++) {
      const classes = await items[i].getAttribute('class');
      if (!classes.includes('visually-hidden')) {
        return i;
      }
    }
    return -1;
  }

  async verifyEntryContainsText(index, text) {
    const entry = this.entryListItems.nth(index);
    await expect(entry).toContainText(text);
  }

  async getAllEntryDates() {
    const count = await this.getEntryCount();
    const dates = [];
    for (let i = 0; i < count; i++) {
      dates.push(await this.getEntryDate(i));
    }
    return dates;
  }

  async verifyEntryListNotEmpty() {
    await expect(this.entryListItems).not.toHaveCount(0);
  }

  async waitForEntries() {
    await this.entryItems.first().waitFor({ state: 'visible', timeout: 10000 });
  }
}

module.exports = EntryListPage;
