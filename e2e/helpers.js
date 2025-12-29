const { expect } = require('@playwright/test');

async function waitForPageLoad(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

async function getApiData(request, endpoint) {
  const response = await request.get(endpoint);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function verifyEntriesLoaded(page, expectedCount) {
  const entries = page.locator('.entry');
  await expect(entries).toHaveCount(expectedCount, { timeout: 10000 });
  return entries;
}

async function verifyMoodData(request) {
  const vitalData = await getApiData(request, '/vital');
  
  expect(vitalData.available_moods).toBeDefined();
  expect(Object.keys(vitalData.available_moods).length).toBeGreaterThan(0);
  
  return vitalData;
}

async function verifyActivityData(request) {
  const vitalData = await getApiData(request, '/vital');
  
  expect(vitalData.available_activities).toBeDefined();
  expect(Object.keys(vitalData.available_activities).length).toBeGreaterThan(0);
  
  return vitalData;
}

async function getStructuredData(request) {
  return getApiData(request, '/structured_data');
}

async function getEntries(request) {
  return getApiData(request, '/entries');
}

module.exports = {
  waitForPageLoad,
  getApiData,
  verifyEntriesLoaded,
  verifyMoodData,
  verifyActivityData,
  getStructuredData,
  getEntries
};
