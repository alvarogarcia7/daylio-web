const { expect } = require('@playwright/test');
const DaylioPage = require('./DaylioPage');

class DashboardPage extends DaylioPage {
  constructor(page) {
    super(page);
    
    this.dashboardHolder = page.locator('#dashboard-holder');
    this.dashboardTitle = this.dashboardHolder.locator('h1');
    this.newEntryButton = page.locator('#toggle-entry-form');
    this.entriesCount = this.dashboardHolder.locator('h4');
    this.metadataText = this.dashboardHolder.locator('h4');
    this.moodGraphTitle = this.dashboardHolder.getByRole('heading', { name: 'Mood Graph' })
    this.yearSelector = page.locator('#mood-graph-year');
    this.monthSelector = page.locator('#mood-graph-month');
    this.moodGraphYearSelect = page.locator('#mood-graph-year');
    this.moodGraphMonthSelect = page.locator('#mood-graph-month');
    this.moodChart = page.locator('.ct-chart');
    
    this.entryForm = page.locator('.entry-form');
    this.entryFormContainer = page.locator('#entry-form-container');
  }

  async isDashboardVisible() {
    return await this.dashboardHolder.isVisible();
  }

  async verifyVisible() {
    await expect(this.dashboardHolder).toBeVisible();
    await expect(this.dashboardHolder).not.toHaveClass(/visually-hidden/);
  }

  async verifyHidden() {
    await expect(this.dashboardHolder).toHaveClass(/visually-hidden/);
  }

  async getDashboardTitle() {
    return await this.dashboardTitle.textContent();
  }

  async clickNewEntry() {
    await this.newEntryButton.click();
  }

  async getEntriesCountText() {
    return await this.entriesCount.textContent();
  }

  async verifyMetadata(expectedEntries, expectedDaysInRow) {
    const text = await this.metadataText.textContent();
    expect(text).toContain(`${expectedEntries} entries`);
    expect(text).toContain(`${expectedDaysInRow} days in a row`);
  }

  async selectYear(year) {
    await this.yearSelector.selectOption(year.toString());
    await this.page.waitForTimeout(500);
  }

  async selectMonth(month) {
    await this.monthSelector.selectOption(month.toString());
    await this.page.waitForTimeout(500);
  }

  async selectMoodGraphYear(year) {
    await this.moodGraphYearSelect.selectOption(year.toString());
  }

  async selectMoodGraphMonth(monthIndex) {
    await this.moodGraphMonthSelect.selectOption(monthIndex.toString());
  }

  async getSelectedYear() {
    return await this.yearSelector.inputValue();
  }

  async getSelectedMonth() {
    return await this.monthSelector.inputValue();
  }

  async getAvailableYears() {
    const options = await this.yearSelector.locator('option').allTextContents();
    return options;
  }

  async getAvailableMonths() {
    const options = await this.monthSelector.locator('option').all();
    const months = [];
    
    for (const option of options) {
      const isDisabled = await option.isDisabled();
      const value = await option.getAttribute('value');
      const text = await option.textContent();
      months.push({ value, text, disabled: isDisabled });
    }
    
    return months;
  }

  async getEnabledMonths() {
    const months = await this.getAvailableMonths();
    return months.filter(m => !m.disabled);
  }

  async isMoodChartVisible() {
    return await this.moodChart.isVisible();
  }

  async verifyMoodChartVisible() {
    await expect(this.moodChart).toBeVisible();
  }

  async hasMoodChartData() {
    const chartLines = await this.page.locator('.ct-chart .ct-series').count();
    return chartLines > 0;
  }

  async getChartPoints() {
    return await this.page.locator('.ct-chart .ct-point').all();
  }

  async verifyEntryFormVisible() {
    await expect(this.entryFormContainer).toBeVisible();
  }

  async verifyEntryFormHidden() {
    await expect(this.entryFormContainer).toHaveClass(/visually-hidden/);
  }

  async waitForChartUpdate() {
    await this.page.waitForTimeout(1000);
  }

  async waitForMoodGraphUpdate() {
    await this.page.waitForTimeout(500);
  }
}

module.exports = DashboardPage;
