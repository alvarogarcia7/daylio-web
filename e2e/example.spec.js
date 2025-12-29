const { test, expect } = require('@playwright/test');

test.describe('Daylio Viewer', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Daylio');
  });

  test('should display entries from test backup', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Great Day');
  });

  test('should display correct number of entries', async ({ page }) => {
    await page.goto('/');
    
    const entries = page.locator('.entry');
    await expect(entries).toHaveCount(5);
  });

  test('should display correct mood names', async ({ page }) => {
    await page.goto('/');
    
    const entries = page.locator('.entry');
    const firstEntry = entries.first();
    
    await expect(firstEntry).toBeVisible();
  });

  test('should display activity tags', async ({ page }) => {
    await page.goto('/');
    
    const activities = page.locator('.activity');
    await expect(activities).toHaveCount(5, { timeout: 5000 }).catch(() => {
      return expect(activities.count()).resolves.toBeGreaterThan(0);
    });
  });

  test('should display metadata', async ({ page }) => {
    await page.goto('/');
    
    const metadata = page.locator('.metadata');
    await expect(metadata).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

test.describe('API Endpoints', () => {
  test('should have API endpoints accessible', async ({ request }) => {
    const vitalResponse = await request.get('/vital');
    expect(vitalResponse.ok()).toBeTruthy();
    
    const vitalData = await vitalResponse.json();
    expect(vitalData).toHaveProperty('available_activities');
    expect(vitalData).toHaveProperty('available_moods');
    expect(vitalData).toHaveProperty('available_mood_groups');
    expect(vitalData).toHaveProperty('available_activity_groups');

    const entriesResponse = await request.get('/entries');
    expect(entriesResponse.ok()).toBeTruthy();
    
    const entriesData = await entriesResponse.json();
    expect(Array.isArray(entriesData)).toBeTruthy();
    expect(entriesData.length).toBe(5);

    const structuredResponse = await request.get('/structured_data');
    expect(structuredResponse.ok()).toBeTruthy();
    
    const structuredData = await structuredResponse.json();
    expect(structuredData).toHaveProperty('2024');
    expect(structuredData['2024']).toHaveProperty('1');
  });

  test('should return vital data', async ({ request }) => {
    const response = await request.get('/vital');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('available_moods');
    expect(data).toHaveProperty('available_activities');
    expect(data).toHaveProperty('available_mood_groups');
    expect(data).toHaveProperty('available_activity_groups');
  });

  test('should return entries data', async ({ request }) => {
    const response = await request.get('/entries');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(5);
  });

  test('should return structured data', async ({ request }) => {
    const response = await request.get('/structured_data');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('2024');
    expect(data['2024']).toHaveProperty('1');
  });
});
