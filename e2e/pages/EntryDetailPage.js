const DaylioPage = require('./DaylioPage');

class EntryDetailPage extends DaylioPage {
  constructor(page) {
    super(page);
    
    this.entryViewHolder = page.locator('#entryview-holder');
    this.closeButton = page.locator('#close-entry');
    this.entryTitle = page.locator('#entry-title');
    this.entryTime = page.locator('#entry-time');
    this.entryDay = page.locator('#entry-day');
    this.entryActivityCount = page.locator('#entry-activity-count');
    this.entryMoodIcon = page.locator('#entry-mood-icon');
    this.entryMoodText = page.locator('#entry-mood-text');
    this.entryNoteViewer = page.locator('#entry-note-viewer');
    this.entryNoteBody = page.locator('#entry-note-body');
    this.toggleAllButton = page.locator('#ac-toggle-all');
    this.activityGroups = page.locator('.ac-group-header');
  }

  async isEntryDetailVisible() {
    return await this.entryViewHolder.evaluate(el => 
      !el.classList.contains('visually-hidden')
    );
  }

  async closeEntry() {
    await this.closeButton.click();
    await this.page.waitForTimeout(300);
  }

  async getEntryTitle() {
    return await this.entryTitle.textContent();
  }

  async getEntryTime() {
    return await this.entryTime.textContent();
  }

  async getEntryDay() {
    return await this.entryDay.textContent();
  }

  async getActivityCount() {
    return await this.entryActivityCount.textContent();
  }

  async getMoodText() {
    return await this.entryMoodText.textContent();
  }

  async getMoodIcon() {
    return await this.entryMoodIcon.textContent();
  }

  async getNoteBody() {
    return await this.entryNoteBody.innerHTML();
  }

  async isNoteVisible() {
    return await this.entryNoteViewer.evaluate(el => 
      !el.classList.contains('visually-hidden')
    );
  }

  async toggleAllActivities() {
    await this.toggleAllButton.click();
    await this.page.waitForTimeout(300);
  }

  async expandActivityGroup(groupId) {
    const groupHeader = this.page.locator(`[data-group-id="${groupId}"]`);
    const collapseIcon = this.page.locator(`#ac-group-${groupId}-collapse`);
    
    const isCollapsed = await collapseIcon.evaluate(el => 
      el.classList.contains('collapsed')
    );
    
    if (isCollapsed) {
      await groupHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  async collapseActivityGroup(groupId) {
    const groupHeader = this.page.locator(`[data-group-id="${groupId}"]`);
    const collapseIcon = this.page.locator(`#ac-group-${groupId}-collapse`);
    
    const isCollapsed = await collapseIcon.evaluate(el => 
      el.classList.contains('collapsed')
    );
    
    if (!isCollapsed) {
      await groupHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  async isActivityGroupExpanded(groupId) {
    const collapseIcon = this.page.locator(`#ac-group-${groupId}-collapse`);
    return await collapseIcon.evaluate(el => 
      !el.classList.contains('collapsed')
    );
  }

  async getActivityGroupItems(groupId) {
    const itemsContainer = this.page.locator(`#ac-group-${groupId}-items`);
    const isHidden = await itemsContainer.evaluate(el => 
      el.classList.contains('visually-hidden')
    );
    
    if (isHidden) {
      return [];
    }
    
    return await itemsContainer.locator('.ac-item').all();
  }

  async getActiveActivities() {
    const activeItems = await this.page.locator('.activity-dot-active').all();
    const activities = [];
    
    for (const item of activeItems) {
      const id = await item.getAttribute('id');
      activities.push(id);
    }
    
    return activities;
  }

  async isActivityActive(activityId) {
    const activity = this.page.locator(`#ac-item-${activityId}`);
    return await activity.evaluate(el => 
      el.classList.contains('activity-dot-active')
    );
  }

  async getActivityIcon(activityId) {
    const activity = this.page.locator(`#ac-item-${activityId}`);
    const img = activity.locator('img');
    return await img.getAttribute('src');
  }

  async getAllActivityGroups() {
    return await this.activityGroups.all();
  }

  async getActivityGroupCount() {
    return await this.activityGroups.count();
  }

  async getActivityGroupLabel(groupId) {
    const groupHeader = this.page.locator(`[data-group-id="${groupId}"]`);
    return await groupHeader.locator('label').textContent();
  }

  async waitForEntryDetail() {
    await this.entryViewHolder.waitFor({ 
      state: 'visible', 
      timeout: 10000 
    });
  }
}

module.exports = EntryDetailPage;
