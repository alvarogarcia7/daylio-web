const { expect } = require('@playwright/test');
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
    this.toggleAllActivitiesButton = page.locator('#ac-toggle-all');
    this.activityGroups = page.locator('.ac-group-header');
    this.activityGroupHeaders = page.locator('.ac-group-header');
    this.activityItems = page.locator('.ac-item');
    this.activeActivityItems = page.locator('.ac-item.activity-dot-active');
  }

  async isEntryDetailVisible() {
    return await this.entryViewHolder.evaluate(el => 
      !el.classList.contains('visually-hidden')
    );
  }

  async verifyVisible() {
    await expect(this.entryViewHolder).toBeVisible();
    await expect(this.entryViewHolder).not.toHaveClass(/visually-hidden/);
  }

  async verifyHidden() {
    await expect(this.entryViewHolder).toHaveClass(/visually-hidden/);
  }

  async closeEntry() {
    await this.closeButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickClose() {
    await this.closeButton.click();
  }

  async getEntryTitle() {
    return await this.entryTitle.textContent();
  }

  async getTitle() {
    return await this.entryTitle.textContent();
  }

  async getEntryTime() {
    return await this.entryTime.textContent();
  }

  async getTime() {
    return await this.entryTime.textContent();
  }

  async getEntryDay() {
    return await this.entryDay.textContent();
  }

  async getDay() {
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

  async verifyEntryDetails(expectedTitle, expectedTime, expectedDay, expectedMood) {
    if (expectedTitle) {
      const title = await this.getTitle();
      expect(title).toContain(expectedTitle);
    }
    if (expectedTime) {
      await expect(this.entryTime).toHaveText(expectedTime);
    }
    if (expectedDay) {
      await expect(this.entryDay).toHaveText(expectedDay);
    }
    if (expectedMood) {
      await expect(this.entryMoodText).toHaveText(expectedMood);
    }
  }

  async getNoteBody() {
    return await this.entryNoteBody.innerHTML();
  }

  async getNoteContent() {
    return await this.entryNoteBody.textContent();
  }

  async isNoteVisible() {
    return await this.entryNoteViewer.evaluate(el => 
      !el.classList.contains('visually-hidden')
    );
  }

  async verifyNoteVisible() {
    await expect(this.entryNoteViewer).toBeVisible();
    await expect(this.entryNoteViewer).not.toHaveClass(/visually-hidden/);
  }

  async verifyNoteHidden() {
    await expect(this.entryNoteViewer).toHaveClass(/visually-hidden/);
  }

  async verifyNoteContent(expectedContent) {
    const content = await this.getNoteContent();
    expect(content).toContain(expectedContent);
  }

  async toggleAllActivities() {
    await this.toggleAllButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickToggleAllActivities() {
    await this.toggleAllActivitiesButton.click();
  }

  async getActiveActivityCount() {
    return await this.activeActivityItems.count();
  }

  async verifyActivityActive(activityId) {
    const activity = this.page.locator(`#ac-item-${activityId}`);
    await expect(activity).toHaveClass(/activity-dot-active/);
  }

  async verifyActivityInactive(activityId) {
    const activity = this.page.locator(`#ac-item-${activityId}`);
    await expect(activity).not.toHaveClass(/activity-dot-active/);
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

  async clickActivityGroup(groupId) {
    await this.page.locator(`[data-group-id="${groupId}"]`).click();
  }

  async isActivityGroupExpanded(groupId) {
    const collapseIcon = this.page.locator(`#ac-group-${groupId}-collapse`);
    return await collapseIcon.evaluate(el => 
      !el.classList.contains('collapsed')
    );
  }

  async verifyActivityGroupExpanded(groupId) {
    const groupItems = this.page.locator(`#ac-group-${groupId}-items`);
    await expect(groupItems).not.toHaveClass(/visually-hidden/);
  }

  async verifyActivityGroupCollapsed(groupId) {
    const groupItems = this.page.locator(`#ac-group-${groupId}-items`);
    await expect(groupItems).toHaveClass(/visually-hidden/);
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

  async expandAllActivityGroups() {
    const count = await this.getActivityGroupCount();
    for (let i = 0; i < count; i++) {
      const header = this.activityGroupHeaders.nth(i);
      const groupId = await header.getAttribute('data-group-id');
      const groupItems = this.page.locator(`#ac-group-${groupId}-items`);
      const isHidden = await groupItems.getAttribute('class');
      if (isHidden && isHidden.includes('visually-hidden')) {
        await header.click();
      }
    }
  }

  async collapseAllActivityGroups() {
    const count = await this.getActivityGroupCount();
    for (let i = 0; i < count; i++) {
      const header = this.activityGroupHeaders.nth(i);
      const groupId = await header.getAttribute('data-group-id');
      const groupItems = this.page.locator(`#ac-group-${groupId}-items`);
      const isHidden = await groupItems.getAttribute('class');
      if (!isHidden || !isHidden.includes('visually-hidden')) {
        await header.click();
      }
    }
  }

  async waitForEntryDetail() {
    await this.entryViewHolder.waitFor({ 
      state: 'visible', 
      timeout: 10000 
    });
  }
}

module.exports = EntryDetailPage;
