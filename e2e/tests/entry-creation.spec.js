const { test, expect } = require('@playwright/test');
const { waitForPageLoad, getApiData } = require('../helpers');

test.describe('Entry Creation Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Form Toggle', () => {
    test('should have new entry button visible', async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      await expect(toggleButton).toBeVisible();
      await expect(toggleButton).toHaveText('+ New Entry');
    });

    test('should initially hide entry form', async ({ page }) => {
      const formContainer = page.locator('#entry-form-container');
      await expect(formContainer).toHaveClass(/visually-hidden/);
    });

    test('should show entry form when toggle button is clicked', async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      const formContainer = page.locator('#entry-form-container');

      await toggleButton.click();

      await expect(formContainer).not.toHaveClass(/visually-hidden/);
    });

    test('should hide entry form when cancel button is clicked', async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      const formContainer = page.locator('#entry-form-container');
      const cancelButton = page.locator('#cancel-entry-form');

      await toggleButton.click();
      await expect(formContainer).not.toHaveClass(/visually-hidden/);

      await cancelButton.click();
      await expect(formContainer).toHaveClass(/visually-hidden/);
    });

    test('should set default date and time when form is opened', async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      const datetimeInput = page.locator('#entry-datetime');

      await toggleButton.click();

      const datetimeValue = await datetimeInput.inputValue();
      expect(datetimeValue).toBeTruthy();
      expect(datetimeValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });

  test.describe('Mood Selection', () => {
    test.beforeEach(async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();
    });

    test('should display mood select dropdown', async ({ page }) => {
      const moodSelect = page.locator('#entry-mood-select');
      await expect(moodSelect).toBeVisible();
    });

    test('should have default placeholder option', async ({ page }) => {
      const moodSelect = page.locator('#entry-mood-select');
      const selectedOption = await moodSelect.locator('option:checked').textContent();
      expect(selectedOption.trim()).toBe('Select a mood');
    });

    test('should display all available moods', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const moodSelect = page.locator('#entry-mood-select');
      const moodOptions = moodSelect.locator('option:not([disabled])');

      await expect(moodOptions).toHaveCount(Object.keys(vitalData.available_moods).length);
    });

    test('should select mood when option is clicked', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];

      await moodSelect.selectOption(firstMoodId);

      await expect(moodSelect).toHaveValue(firstMoodId);
    });

    test('should display correct mood names', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const moodSelect = page.locator('#entry-mood-select');

      for (const [moodId, moodName] of Object.entries(vitalData.available_moods)) {
        const option = moodSelect.locator(`option[value="${moodId}"]`);
        await expect(option).toHaveText(moodName);
      }
    });
  });

  test.describe('Activity Selection', () => {
    test.beforeEach(async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();
    });

    test('should display activity groups container', async ({ page }) => {
      const activityGroupsContainer = page.locator('#activity-groups-container');
      await expect(activityGroupsContainer).toBeVisible();
    });

    test('should display all activity groups', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const activityGroups = page.locator('.form-ac-group-header');

      await expect(activityGroups).toHaveCount(Object.keys(vitalData.available_activity_groups).length);
    });

    test('should display activity group names', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const activityGroups = page.locator('.form-ac-group-header');

      for (const [groupId, groupName] of Object.entries(vitalData.available_activity_groups)) {
        const groupHeader = activityGroups.filter({ has: page.locator(`[data-group-id="${groupId}"]`) });
        await expect(groupHeader).toContainText(groupName);
      }
    });

    test('should have activity groups initially collapsed', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const collapseIcon = page.locator(`#form-ac-group-${firstGroupId}-collapse`);
      const groupItems = page.locator(`#form-ac-group-${firstGroupId}-items`);

      await expect(collapseIcon).toHaveClass(/collapsed/);
      await expect(groupItems).toHaveClass(/visually-hidden/);
    });

    test('should expand activity group on click', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);
      const collapseIcon = page.locator(`#form-ac-group-${firstGroupId}-collapse`);
      const groupItems = page.locator(`#form-ac-group-${firstGroupId}-items`);

      await groupHeader.click();

      await expect(collapseIcon).not.toHaveClass(/collapsed/);
      await expect(groupItems).not.toHaveClass(/visually-hidden/);
    });

    test('should display activities with icons', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);

      await groupHeader.click();

      const activityCheckboxes = page.locator('.activity-checkbox');
      const count = await activityCheckboxes.count();
      expect(count).toBeGreaterThan(0);

      const firstCheckboxId = await activityCheckboxes.first().getAttribute('id');
      const activityId = firstCheckboxId.replace('activity-', '');
      const activityIcon = page.locator(`label[for="${firstCheckboxId}"] img`);
      
      await expect(activityIcon).toBeVisible();
      await expect(activityIcon).toHaveAttribute('src', new RegExp(`ic_${vitalData.available_activities[activityId].icon}.png`));
    });

    test('should filter activities by group', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      for (const [groupId, groupName] of Object.entries(vitalData.available_activity_groups)) {
        const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${groupId}"]`);
        await groupHeader.click();

        const groupActivities = Object.entries(vitalData.available_activities)
          .filter(([_, activity]) => activity.group == groupId);

        const displayedCheckboxes = page.locator(`#form-ac-group-${groupId}-items .activity-checkbox`);
        await expect(displayedCheckboxes).toHaveCount(groupActivities.length);

        await groupHeader.click();
      }
    });

    test('should allow multiple activity selection', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);

      await groupHeader.click();

      const checkboxes = page.locator(`#form-ac-group-${firstGroupId}-items .activity-checkbox`);
      const count = await checkboxes.count();

      if (count >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        await expect(checkboxes.nth(0)).toBeChecked();
        await expect(checkboxes.nth(1)).toBeChecked();
      }
    });

    test('should allow deselecting activities', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);

      await groupHeader.click();

      const firstCheckbox = page.locator(`#form-ac-group-${firstGroupId}-items .activity-checkbox`).first();
      
      await firstCheckbox.check();
      await expect(firstCheckbox).toBeChecked();

      await firstCheckbox.uncheck();
      await expect(firstCheckbox).not.toBeChecked();
    });
  });

  test.describe('Date and Time Input', () => {
    test.beforeEach(async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();
    });

    test('should display datetime input field', async ({ page }) => {
      const datetimeInput = page.locator('#entry-datetime');
      await expect(datetimeInput).toBeVisible();
      await expect(datetimeInput).toHaveAttribute('type', 'datetime-local');
    });

    test('should accept custom date and time', async ({ page }) => {
      const datetimeInput = page.locator('#entry-datetime');
      const customDatetime = '2024-06-15T14:30';

      await datetimeInput.fill(customDatetime);

      await expect(datetimeInput).toHaveValue(customDatetime);
    });

    test('should require datetime value', async ({ page }) => {
      const datetimeInput = page.locator('#entry-datetime');
      await expect(datetimeInput).toHaveAttribute('required');
    });
  });

  test.describe('Title and Note Fields', () => {
    test.beforeEach(async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();
    });

    test('should display title input field', async ({ page }) => {
      const titleInput = page.locator('#entry-note-title');
      await expect(titleInput).toBeVisible();
    });

    test('should accept title input', async ({ page }) => {
      const titleInput = page.locator('#entry-note-title');
      const title = 'Test Entry Title';

      await titleInput.fill(title);

      await expect(titleInput).toHaveValue(title);
    });

    test('should display note textarea', async ({ page }) => {
      const noteTextarea = page.locator('#entry-note-text');
      await expect(noteTextarea).toBeVisible();
    });

    test('should accept note input', async ({ page }) => {
      const noteTextarea = page.locator('#entry-note-text');
      const note = 'This is a test note for the entry.';

      await noteTextarea.fill(note);

      await expect(noteTextarea).toHaveValue(note);
    });

    test('should accept multiline note input', async ({ page }) => {
      const noteTextarea = page.locator('#entry-note-text');
      const note = 'Line 1\nLine 2\nLine 3';

      await noteTextarea.fill(note);

      await expect(noteTextarea).toHaveValue(note);
    });
  });

  test.describe('Form Submission - Valid Entry', () => {
    test('should successfully create entry with all fields', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const initialEntries = await getApiData(request, '/entries');
      const initialCount = initialEntries.length;

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);
      await groupHeader.click();
      
      const firstCheckbox = page.locator(`#form-ac-group-${firstGroupId}-items .activity-checkbox`).first();
      const activityId = await firstCheckbox.getAttribute('value');
      await firstCheckbox.check();

      const datetimeInput = page.locator('#entry-datetime');
      const testDatetime = '2024-03-15T15:30';
      await datetimeInput.fill(testDatetime);

      const titleInput = page.locator('#entry-note-title');
      const testTitle = 'E2E Test Entry';
      await titleInput.fill(testTitle);

      const noteTextarea = page.locator('#entry-note-text');
      const testNote = 'This is a test entry created by e2e tests.';
      await noteTextarea.fill(testNote);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const statusMessage = page.locator('#form-status-message');
      await expect(statusMessage).toContainText('Entry created successfully!', { timeout: 5000 });

      await page.waitForTimeout(1500);

      const updatedEntries = await getApiData(request, '/entries');
      expect(updatedEntries.length).toBe(initialCount + 1);
    });

    test('should successfully create entry with only required fields', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const initialEntries = await getApiData(request, '/entries');
      const initialCount = initialEntries.length;

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const datetimeInput = page.locator('#entry-datetime');
      const testDatetime = '2024-03-16T10:00';
      await datetimeInput.fill(testDatetime);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const statusMessage = page.locator('#form-status-message');
      await expect(statusMessage).toContainText('Entry created successfully!', { timeout: 5000 });

      await page.waitForTimeout(1500);

      const updatedEntries = await getApiData(request, '/entries');
      expect(updatedEntries.length).toBe(initialCount + 1);
    });

    test('should successfully create entry with multiple activities', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const initialEntries = await getApiData(request, '/entries');
      const initialCount = initialEntries.length;

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);
      await groupHeader.click();
      
      const checkboxes = page.locator(`#form-ac-group-${firstGroupId}-items .activity-checkbox`);
      const count = await checkboxes.count();
      
      if (count >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
      }

      const datetimeInput = page.locator('#entry-datetime');
      const testDatetime = '2024-03-17T12:00';
      await datetimeInput.fill(testDatetime);

      const titleInput = page.locator('#entry-note-title');
      await titleInput.fill('Multiple Activities Test');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const statusMessage = page.locator('#form-status-message');
      await expect(statusMessage).toContainText('Entry created successfully!', { timeout: 5000 });

      await page.waitForTimeout(1500);

      const updatedEntries = await getApiData(request, '/entries');
      expect(updatedEntries.length).toBe(initialCount + 1);
    });

    test('should display created entry in entry list after page reload', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const datetimeInput = page.locator('#entry-datetime');
      const testDatetime = '2024-03-18T09:00';
      await datetimeInput.fill(testDatetime);

      const titleInput = page.locator('#entry-note-title');
      const uniqueTitle = `Test Entry ${Date.now()}`;
      await titleInput.fill(uniqueTitle);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);

      const entries = await getApiData(request, '/entries');
      const createdEntry = entries.find(e => e.journal[0] === uniqueTitle);
      expect(createdEntry).toBeDefined();
      expect(createdEntry.mood).toBe(parseInt(firstMoodId));
    });

    test('should reset form after successful submission', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const titleInput = page.locator('#entry-note-title');
      await titleInput.fill('Test Entry');

      const noteTextarea = page.locator('#entry-note-text');
      await noteTextarea.fill('Test note');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);

      await toggleButton.click();

      const moodValue = await moodSelect.inputValue();
      const titleValue = await titleInput.inputValue();
      const noteValue = await noteTextarea.inputValue();

      expect(moodValue).toBe('');
      expect(titleValue).toBe('');
      expect(noteValue).toBe('');
    });
  });

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();
    });

    test('should show error when submitting without mood', async ({ page }) => {
      const datetimeInput = page.locator('#entry-datetime');
      await datetimeInput.fill('2024-03-20T10:00');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const statusMessage = page.locator('#form-status-message');
      await expect(statusMessage).toContainText('Please select a mood', { timeout: 3000 });
      await expect(statusMessage).toHaveClass(/text-danger/);
    });

    test('should show error when submitting without datetime', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const datetimeInput = page.locator('#entry-datetime');
      await datetimeInput.fill('');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const statusMessage = page.locator('#form-status-message');
      await expect(statusMessage).toContainText('Please select a date and time', { timeout: 3000 });
      await expect(statusMessage).toHaveClass(/text-danger/);
    });

    test('should clear error message after 5 seconds', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const statusMessage = page.locator('#form-status-message');
      await expect(statusMessage).toContainText('Please select a mood', { timeout: 3000 });

      await page.waitForTimeout(5500);

      const messageText = await statusMessage.textContent();
      expect(messageText).toBe('');
    });

    test('should handle API error responses', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      await page.route('/api/entries', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const datetimeInput = page.locator('#entry-datetime');
      await datetimeInput.fill('2024-03-21T10:00');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const statusMessage = page.locator('#form-status-message');
      await expect(statusMessage).toContainText('Error', { timeout: 3000 });
      await expect(statusMessage).toHaveClass(/text-danger/);
    });

    test('should handle network errors', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      await page.route('/api/entries', route => {
        route.abort('failed');
      });

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const datetimeInput = page.locator('#entry-datetime');
      await datetimeInput.fill('2024-03-22T10:00');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const statusMessage = page.locator('#form-status-message');
      await expect(statusMessage).toContainText('Error', { timeout: 3000 });
      await expect(statusMessage).toHaveClass(/text-danger/);
    });
  });

  test.describe('Form Reset', () => {
    test('should reset form when cancel button is clicked', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const titleInput = page.locator('#entry-note-title');
      await titleInput.fill('Test Title');

      const noteTextarea = page.locator('#entry-note-text');
      await noteTextarea.fill('Test note');

      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);
      await groupHeader.click();
      
      const firstCheckbox = page.locator(`#form-ac-group-${firstGroupId}-items .activity-checkbox`).first();
      await firstCheckbox.check();

      const cancelButton = page.locator('#cancel-entry-form');
      await cancelButton.click();

      await toggleButton.click();

      const moodValue = await moodSelect.inputValue();
      const titleValue = await titleInput.inputValue();
      const noteValue = await noteTextarea.inputValue();
      const checkboxChecked = await firstCheckbox.isChecked();

      expect(moodValue).toBe('');
      expect(titleValue).toBe('');
      expect(noteValue).toBe('');
      expect(checkboxChecked).toBe(false);
    });
  });

  test.describe('Database Persistence', () => {
    test('should persist entry across page reloads', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const secondMoodId = Object.keys(vitalData.available_moods)[1];
      await moodSelect.selectOption(secondMoodId);

      const datetimeInput = page.locator('#entry-datetime');
      const testDatetime = '2024-04-01T14:00';
      await datetimeInput.fill(testDatetime);

      const titleInput = page.locator('#entry-note-title');
      const uniqueTitle = `Persistence Test ${Date.now()}`;
      await titleInput.fill(uniqueTitle);

      const noteTextarea = page.locator('#entry-note-text');
      const uniqueNote = 'This entry should persist after reload';
      await noteTextarea.fill(uniqueNote);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);

      await page.reload();
      await waitForPageLoad(page);

      const entries = await getApiData(request, '/entries');
      const persistedEntry = entries.find(e => e.journal[0] === uniqueTitle);
      
      expect(persistedEntry).toBeDefined();
      expect(persistedEntry.mood).toBe(parseInt(secondMoodId));
      expect(persistedEntry.journal[1]).toBe(uniqueNote);
    });

    test('should persist entry with activities', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);
      await groupHeader.click();
      
      const checkboxes = page.locator(`#form-ac-group-${firstGroupId}-items .activity-checkbox`);
      const firstActivityId = parseInt(await checkboxes.nth(0).getAttribute('value'));
      await checkboxes.nth(0).check();

      const datetimeInput = page.locator('#entry-datetime');
      const testDatetime = '2024-04-02T16:00';
      await datetimeInput.fill(testDatetime);

      const titleInput = page.locator('#entry-note-title');
      const uniqueTitle = `Activity Test ${Date.now()}`;
      await titleInput.fill(uniqueTitle);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);

      await page.reload();
      await waitForPageLoad(page);

      const entries = await getApiData(request, '/entries');
      const persistedEntry = entries.find(e => e.journal[0] === uniqueTitle);
      
      expect(persistedEntry).toBeDefined();
      expect(persistedEntry.activities).toContain(firstActivityId);
    });

    test('should make created entry available via API', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const entriesBeforeCreate = await getApiData(request, '/entries');

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const datetimeInput = page.locator('#entry-datetime');
      const testDatetime = '2024-04-03T11:00';
      await datetimeInput.fill(testDatetime);

      const titleInput = page.locator('#entry-note-title');
      const uniqueTitle = `API Test ${Date.now()}`;
      await titleInput.fill(uniqueTitle);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);

      const entriesAfterCreate = await getApiData(request, '/entries');
      
      expect(entriesAfterCreate.length).toBe(entriesBeforeCreate.length + 1);
      
      const newEntry = entriesAfterCreate.find(e => e.journal[0] === uniqueTitle);
      expect(newEntry).toBeDefined();
      expect(newEntry.mood).toBe(parseInt(firstMoodId));
    });
  });

  test.describe('Form UI Interactions', () => {
    test('should maintain form state when expanding/collapsing activity groups', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const moodSelect = page.locator('#entry-mood-select');
      const firstMoodId = Object.keys(vitalData.available_moods)[0];
      await moodSelect.selectOption(firstMoodId);

      const titleInput = page.locator('#entry-note-title');
      await titleInput.fill('State Test');

      const firstGroupId = Object.keys(vitalData.available_activity_groups)[0];
      const groupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);
      
      await groupHeader.click();
      await groupHeader.click();

      const moodValue = await moodSelect.inputValue();
      const titleValue = await titleInput.inputValue();

      expect(moodValue).toBe(firstMoodId);
      expect(titleValue).toBe('State Test');
    });

    test('should allow selecting activities from multiple groups', async ({ page, request }) => {
      const vitalData = await getApiData(request, '/vital');
      const activityGroups = Object.keys(vitalData.available_activity_groups);

      if (activityGroups.length < 2) {
        test.skip();
      }

      const toggleButton = page.locator('#toggle-entry-form');
      await toggleButton.click();

      const firstGroupId = activityGroups[0];
      const firstGroupHeader = page.locator(`.form-ac-group-header[data-group-id="${firstGroupId}"]`);
      await firstGroupHeader.click();
      const firstGroupCheckbox = page.locator(`#form-ac-group-${firstGroupId}-items .activity-checkbox`).first();
      await firstGroupCheckbox.check();

      const secondGroupId = activityGroups[1];
      const secondGroupHeader = page.locator(`.form-ac-group-header[data-group-id="${secondGroupId}"]`);
      await secondGroupHeader.click();
      const secondGroupCheckbox = page.locator(`#form-ac-group-${secondGroupId}-items .activity-checkbox`).first();
      await secondGroupCheckbox.check();

      await expect(firstGroupCheckbox).toBeChecked();
      await expect(secondGroupCheckbox).toBeChecked();
    });
  });
});
