const DaylioPage = require('./DaylioPage');

class EntryListPage extends DaylioPage {
  constructor(page) {
    super(page);
    
    this.entryListView = page.locator('.entrylist-view');
    this.searchInput = page.locator('#entry-search');
    this.entryList = page.locator('#entry-list-view');
    this.entryItems = page.locator('.entry-list-item');
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
    const visible = await this.getVisibleEntries();
    return visible.length;
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

  async getEntryDate(entryId) {
    const entry = this.page.locator(`[data-entry-id="${entryId}"]`);
    return await entry.locator('.fw-bold').textContent();
  }

  async getEntryMood(entryId) {
    const entry = this.page.locator(`[data-entry-id="${entryId}"]`);
    return await entry.locator('.badge').textContent();
  }

  async getEntryActivitiesPreview(entryId) {
    const entry = this.page.locator(`[data-entry-id="${entryId}"]`);
    const container = entry.locator('.ms-2.me-auto');
    const lines = await container.locator('text=/[^\\n]+/').allTextContents();
    
    return lines.length > 1 ? lines[1] : 'No activities';
  }

  async waitForEntries() {
    await this.entryItems.first().waitFor({ state: 'visible', timeout: 10000 });
  }
}

module.exports = EntryListPage;
