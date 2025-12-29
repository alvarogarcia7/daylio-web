const { expect } = require('@playwright/test');

class DaylioPage {
  constructor(page) {
    this.page = page;
    
    this.navbar = page.locator('nav.navbar');
    this.title = page.locator('h3.daylio-color');
    this.themeToggle = page.locator('#change-theme');
    this.loader = page.locator('#loader-div');
    this.mainDiv = page.locator('#main-div');
    this.mainContainer = page.locator('#main-div');
    this.searchInput = page.locator('#entry-search');
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForLoad();
  }

  async waitForLoad() {
    // Wait for loader to have visually-hidden class
    await this.page.waitForFunction(() => {
      const loader = document.getElementById('loader-div');
      return loader && loader.classList.contains('visually-hidden');
    }, { timeout: 10000 });
    
    // Wait for main div to not have visually-hidden class
    await this.page.waitForFunction(() => {
      const mainDiv = document.getElementById('main-div');
      return mainDiv && !mainDiv.classList.contains('visually-hidden');
    }, { timeout: 10000 });
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.loader.waitFor({ state: 'hidden', timeout: 10000 });
    await this.mainContainer.waitFor({ state: 'visible', timeout: 10000 });
  }

  async verifyTitle(expectedTitle = 'Daylio') {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  async setLightMode() {
    await this.page.evaluate(() => {
      window.setLightMode();
    });
  }

  async setDarkMode() {
    await this.page.evaluate(() => {
      window.setDarkMode();
    });
  }

  async getTheme() {
    return await this.page.locator('body').getAttribute('data-bs-theme');
  }

  async getCurrentTheme() {
    const body = this.page.locator('body');
    return await body.getAttribute('data-bs-theme');
  }

  async getTitle() {
    return await this.title.textContent();
  }

  async searchEntries(query) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async fetchVitalData() {
    const response = await this.page.request.get('/vital');
    return await response.json();
  }

  async fetchEntries() {
    const response = await this.page.request.get('/entries');
    return await response.json();
  }

  async fetchStructuredData() {
    const response = await this.page.request.get('/structured_data');
    return await response.json();
  }

  async getApiData(endpoint) {
    const response = await this.page.request.get(endpoint);
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async getVitalData() {
    return this.getApiData('/vital');
  }

  async getEntries() {
    return this.getApiData('/entries');
  }

  async getStructuredData() {
    return this.getApiData('/structured_data');
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async isLoaderVisible() {
    return await this.loader.isVisible();
  }

  async isMainVisible() {
    return await this.mainDiv.isVisible();
  }

  async isMainContainerVisible() {
    return await this.mainContainer.isVisible();
  }
}

module.exports = DaylioPage;
