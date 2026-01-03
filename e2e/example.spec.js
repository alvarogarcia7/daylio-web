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

  test('should have API endpoints accessible', async ({ request }) => {
    const vitalResponse = await request.get('/vital');
    expect(vitalResponse.ok()).toBeTruthy();
    
    const vitalData = await vitalResponse.json();
    expect(vitalData).toHaveProperty('available_activities');
    expect(vitalData).toHaveProperty('available_moods');

    const entriesResponse = await request.get('/entries');
    expect(entriesResponse.ok()).toBeTruthy();
    
    const entriesData = await entriesResponse.json();
    expect(Array.isArray(entriesData)).toBeTruthy();
    expect(entriesData.length).toBe(5);

    const structuredResponse = await request.get('/structured_data');
    expect(structuredResponse.ok()).toBeTruthy();
    
    const structuredData = await structuredResponse.json();
    expect(structuredData).toHaveProperty('2024');
  });
});
