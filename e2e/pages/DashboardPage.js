const DaylioPage = require('./DaylioPage');

class DashboardPage extends DaylioPage {
  constructor(page) {
    super(page);
    
    this.dashboardHolder = page.locator('#dashboard-holder');
    this.dashboardTitle = this.dashboardHolder.locator('h1');
    this.entriesCount = this.dashboardHolder.locator('h4');
    this.moodGraphTitle = this.dashboardHolder.locator('h5');
    this.yearSelector = page.locator('#mood-graph-year');
    this.monthSelector = page.locator('#mood-graph-month');
    this.moodChart = page.locator('.ct-chart');
  }

  async isDashboardVisible() {
    return await this.dashboardHolder.isVisible();
  }

  async getDashboardTitle() {
    return await this.dashboardTitle.textContent();
  }

  async getEntriesCountText() {
    return await this.entriesCount.textContent();
  }

  async selectYear(year) {
    await this.yearSelector.selectOption(year.toString());
    await this.page.waitForTimeout(500);
  }

  async selectMonth(month) {
    await this.monthSelector.selectOption(month.toString());
    await this.page.waitForTimeout(500);
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

  async hasMoodChartData() {
    const chartLines = await this.page.locator('.ct-chart .ct-series').count();
    return chartLines > 0;
  }

  async getChartPoints() {
    return await this.page.locator('.ct-chart .ct-point').all();
  }

  async waitForChartUpdate() {
    await this.page.waitForTimeout(1000);
  }
}

module.exports = DashboardPage;
