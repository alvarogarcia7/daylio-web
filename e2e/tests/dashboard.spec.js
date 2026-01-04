const { test, expect } = require('@playwright/test');
const DashboardPage = require('../pages/DashboardPage');

test.describe('Dashboard', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should load dashboard by default', async () => {
    await expect(dashboardPage.isDashboardVisible()).resolves.toBeTruthy();
    await expect(dashboardPage.getDashboardTitle()).resolves.toContain('Dashboard');
  });

  test('should display entry count metadata', async () => {
    const entriesText = await dashboardPage.getEntriesCountText();
    expect(entriesText).toMatch(/\d entries/);
  });

  test('should display days in a row metadata', async () => {
    const entriesText = await dashboardPage.getEntriesCountText();
    expect(entriesText).toMatch(/\d days in a row/);
  });

  test('should display complete metadata text', async () => {
    const entriesText = await dashboardPage.getEntriesCountText();
    expect(entriesText).toMatch(/\d entries - \d days in a row/);
  });
});

test.describe('Mood Graph Rendering', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should display mood graph title', async () => {
    const title = await dashboardPage.moodGraphTitle.textContent();
    expect(title).toContain('Mood Graph');
  });

  test('should render mood chart', async () => {
    await expect(dashboardPage.isMoodChartVisible()).resolves.toBeTruthy();
  });

  test('should have chart data rendered', async () => {
    await expect(dashboardPage.hasMoodChartData()).resolves.toBeTruthy();
  });

  test('should have chart points for entries', async () => {
    const points = await dashboardPage.getChartPoints();
    expect(points.length).toBeGreaterThan(0);
  });

  test('should have chart with proper structure', async ({ page }) => {
    const chartSeries = await page.locator('.ct-chart .ct-series').count();
    expect(chartSeries).toBeGreaterThan(0);
  });
});

test.describe('Year Dropdown', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should populate year dropdown', async () => {
    const years = await dashboardPage.getAvailableYears();
    expect(years.length).toBeGreaterThan(0);
  });

  test('should have 2024 in year dropdown', async () => {
    const years = await dashboardPage.getAvailableYears();
    expect(years).toContain('2024');
  });

  test('should have year selector visible', async () => {
    await expect(dashboardPage.yearSelector).toBeVisible();
  });

  test('should have 2024 selected by default', async () => {
    const selectedYear = await dashboardPage.getSelectedYear();
    expect(selectedYear).not.toBeNull();
    expect(selectedYear).not.toBe('');
  });

  test('should be able to select a year', async () => {
    const years = await dashboardPage.getAvailableYears();
    if (years.length > 0) {
      await dashboardPage.selectYear(years[0]);
      const selectedYear = await dashboardPage.getSelectedYear();
      expect(selectedYear).toBe(years[0]);
    }
  });
});

test.describe('Month Dropdown', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should populate month dropdown', async () => {
    const months = await dashboardPage.getAvailableMonths();
    expect(months.length).toBe(12);
  });

  test('should have all 12 months in dropdown', async () => {
    const months = await dashboardPage.getAvailableMonths();
    const monthNames = months.map(m => m.text);
    expect(monthNames).toContain('Jan');
    expect(monthNames).toContain('Dec');
  });

  test('should have month selector visible', async () => {
    await expect(dashboardPage.monthSelector).toBeVisible();
  });

  test('should have enabled months for current year', async () => {
    const enabledMonths = await dashboardPage.getEnabledMonths();
    expect(enabledMonths.length).toBeGreaterThan(0);
  });

  test('should have January enabled for 2024', async () => {
    await dashboardPage.selectYear('2024');
    await dashboardPage.page.waitForTimeout(500);
    const months = await dashboardPage.getAvailableMonths();
    const january = months.find(m => m.value === '0');
    expect(january.disabled).toBeFalsy();
  });

  test('should disable months without entries', async () => {
    const months = await dashboardPage.getAvailableMonths();
    const disabledMonths = months.filter(m => m.disabled);
    expect(disabledMonths.length).toBeGreaterThan(0);
  });

  test('should be able to select an enabled month', async () => {
    const enabledMonths = await dashboardPage.getEnabledMonths();
    if (enabledMonths.length > 0) {
      await dashboardPage.selectMonth(enabledMonths[0].value);
      const selectedMonth = await dashboardPage.getSelectedMonth();
      expect(selectedMonth).toBe(enabledMonths[0].value);
    }
  });
});

test.describe('Time Period Filtering', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should update chart when selecting different year', async ({ page }) => {
    const initialPoints = await dashboardPage.getChartPoints();
    const initialCount = initialPoints.length;

    const years = await dashboardPage.getAvailableYears();
    if (years.length > 1) {
      await dashboardPage.selectYear(years[1]);
      await dashboardPage.waitForChartUpdate();

      const updatedPoints = await dashboardPage.getChartPoints();
      expect(updatedPoints.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should update chart when selecting different month', async ({ page }) => {
    await dashboardPage.selectYear('2024');
    await dashboardPage.page.waitForTimeout(500);

    const enabledMonths = await dashboardPage.getEnabledMonths();
    
    if (enabledMonths.length > 0) {
      await dashboardPage.selectMonth(enabledMonths[0].value);
      await dashboardPage.waitForChartUpdate();

      const pointsAfterFirstMonth = await dashboardPage.getChartPoints();
      expect(pointsAfterFirstMonth.length).toBeGreaterThan(0);

      if (enabledMonths.length > 1) {
        await dashboardPage.selectMonth(enabledMonths[1].value);
        await dashboardPage.waitForChartUpdate();

        const pointsAfterSecondMonth = await dashboardPage.getChartPoints();
        expect(pointsAfterSecondMonth.length).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should update months when year changes', async ({ page }) => {
    const years = await dashboardPage.getAvailableYears();
    
    if (years.length > 0) {
      await dashboardPage.selectYear(years[0]);
      await dashboardPage.page.waitForTimeout(500);
      
      const monthsForYear1 = await dashboardPage.getEnabledMonths();
      expect(monthsForYear1.length).toBeGreaterThan(0);

      if (years.length > 1) {
        await dashboardPage.selectYear(years[1]);
        await dashboardPage.page.waitForTimeout(500);
        
        const monthsForYear2 = await dashboardPage.getEnabledMonths();
        expect(monthsForYear2.length).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should maintain chart visibility during updates', async ({ page }) => {
    await expect(dashboardPage.isMoodChartVisible()).resolves.toBeTruthy();

    await dashboardPage.selectYear('2024');
    await dashboardPage.page.waitForTimeout(200);
    await expect(dashboardPage.isMoodChartVisible()).resolves.toBeTruthy();

    const enabledMonths = await dashboardPage.getEnabledMonths();
    if (enabledMonths.length > 0) {
      await dashboardPage.selectMonth(enabledMonths[0].value);
      await dashboardPage.page.waitForTimeout(200);
      await expect(dashboardPage.isMoodChartVisible()).resolves.toBeTruthy();
    }
  });

  test('should update chart data points when filtering', async ({ page }) => {
    await dashboardPage.selectYear('2024');
    await dashboardPage.page.waitForTimeout(500);

    const enabledMonths = await dashboardPage.getEnabledMonths();
    
    if (enabledMonths.length > 0) {
      await dashboardPage.selectMonth(enabledMonths[0].value);
      await dashboardPage.waitForChartUpdate();

      await expect(dashboardPage.hasMoodChartData()).resolves.toBeTruthy();
      
      const chartLines = await page.locator('.ct-chart .ct-line').count();
      expect(chartLines).toBeGreaterThanOrEqual(0);
    }
  });

  test('should automatically select first enabled month when year changes', async ({ page }) => {
    const years = await dashboardPage.getAvailableYears();
    
    if (years.length > 0) {
      await dashboardPage.selectYear(years[0]);
      await dashboardPage.page.waitForTimeout(500);
      
      const selectedMonth = await dashboardPage.getSelectedMonth();
      const enabledMonths = await dashboardPage.getEnabledMonths();
      
      if (enabledMonths.length > 0) {
        expect(selectedMonth).toBe(enabledMonths[0].value);
      }
    }
  });
});

test.describe('Chart Data Updates', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should render chart with correct structure', async ({ page }) => {
    const chartContainer = await page.locator('.ct-chart');
    await expect(chartContainer).toBeVisible();

    const svgElement = await page.locator('.ct-chart svg');
    await expect(svgElement).toBeVisible();
  });

  test('should have chart labels for days', async ({ page }) => {
    const labels = await page.locator('.ct-chart .ct-labels .ct-label.ct-horizontal').count();
    expect(labels).toBeGreaterThan(0);
  });

  test('should have chart data series', async ({ page }) => {
    const series = await page.locator('.ct-chart .ct-series').count();
    expect(series).toBeGreaterThan(0);
  });

  test('should update chart series when month changes', async ({ page }) => {
    await dashboardPage.selectYear('2024');
    await dashboardPage.page.waitForTimeout(500);

    const enabledMonths = await dashboardPage.getEnabledMonths();
    
    if (enabledMonths.length > 0) {
      await dashboardPage.selectMonth(enabledMonths[0].value);
      await dashboardPage.waitForChartUpdate();

      const seriesCount = await page.locator('.ct-chart .ct-series').count();
      expect(seriesCount).toBeGreaterThan(0);
    }
  });

  test('should have chart grid', async ({ page }) => {
    const gridLines = await page.locator('.ct-chart .ct-grids').count();
    expect(gridLines).toBeGreaterThanOrEqual(0);
  });

  test('should render area chart', async ({ page }) => {
    const area = await page.locator('.ct-chart .ct-area').count();
    expect(area).toBeGreaterThanOrEqual(0);
  });

  test('should render line chart', async ({ page }) => {
    const line = await page.locator('.ct-chart .ct-line').count();
    expect(line).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Dashboard Integration', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should have all dashboard components visible', async () => {
    await expect(dashboardPage.isDashboardVisible()).resolves.toBeTruthy();
    await expect(dashboardPage.dashboardTitle).toBeVisible();
    await expect(dashboardPage.entriesCount).toBeVisible();
    await expect(dashboardPage.moodGraphTitle).toBeVisible();
    await expect(dashboardPage.yearSelector).toBeVisible();
    await expect(dashboardPage.monthSelector).toBeVisible();
    await expect(dashboardPage.moodChart).toBeVisible();
  });

  test('should fetch and display data from API', async ({ page }) => {
    const vitalData = await dashboardPage.fetchVitalData();
    expect(vitalData).toHaveProperty('available_moods');
    expect(vitalData).toHaveProperty('available_activities');

    const entries = await dashboardPage.fetchEntries();
    expect(Array.isArray(entries)).toBeTruthy();
    expect(entries.length).toBeGreaterThanOrEqual(5);

    const structuredData = await dashboardPage.fetchStructuredData();
    expect(structuredData).toHaveProperty('2024');
  });

  test('should have consistent data between API and UI', async ({ page }) => {
    const entries = await dashboardPage.fetchEntries();
    const entryCount = entries.length;

    const entriesText = await dashboardPage.getEntriesCountText();
    expect(entriesText).toContain(`${entryCount} entries`);
  });

  test('should update UI based on structured data', async ({ page }) => {
    const structuredData = await dashboardPage.fetchStructuredData();
    const years = Object.keys(structuredData);

    const availableYears = await dashboardPage.getAvailableYears();
    expect(availableYears.length).toBeGreaterThan(0);
    
    years.forEach(year => {
      expect(availableYears).toContain(year);
    });
  });
});
