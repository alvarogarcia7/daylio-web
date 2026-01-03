class DaylioPage {
  constructor(page) {
    this.page = page;
    
    this.navbar = page.locator('nav.navbar');
    this.title = page.locator('h3.daylio-color');
    this.themeToggle = page.locator('#change-theme');
    this.loader = page.locator('#loader-div');
    this.mainDiv = page.locator('#main-div');
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

  async getTitle() {
    return await this.title.textContent();
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

  async isLoaderVisible() {
    return await this.loader.isVisible();
  }

  async isMainVisible() {
    return await this.mainDiv.isVisible();
  }
}

module.exports = DaylioPage;
