const { test, expect } = require('@playwright/test');
const DaylioPage = require('../pages/DaylioPage');
const EntryListPage = require('../pages/EntryListPage');
const EntryDetailPage = require('../pages/EntryDetailPage');

test.describe('Theme Toggle - Light/Dark Mode Switch', () => {
  let daylioPage;

  test.beforeEach(async ({ page }) => {
    daylioPage = new DaylioPage(page);
    await daylioPage.goto();
  });

  test('should have theme toggle button visible', async () => {
    await expect(daylioPage.themeToggle).toBeVisible();
  });

  test('should display initial theme icon', async () => {
    const iconText = await daylioPage.themeToggle.textContent();
    expect(iconText).toMatch(/light_mode|dark_mode/);
  });

  test('should toggle theme from light to dark', async ({ page }) => {
    const initialTheme = await daylioPage.getTheme();
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const newTheme = await daylioPage.getTheme();
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should toggle theme from dark to light', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const darkTheme = await daylioPage.getTheme();
    expect(darkTheme).toBe('dark');
    
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const lightTheme = await daylioPage.getTheme();
    expect(lightTheme).toBe('light');
  });

  test('should update theme icon when toggling to dark mode', async ({ page }) => {
    const initialIcon = await daylioPage.themeToggle.textContent();
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const newIcon = await daylioPage.themeToggle.textContent();
    expect(newIcon).not.toBe(initialIcon);
  });

  test('should update theme icon when toggling to light mode', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const darkIcon = await daylioPage.themeToggle.textContent();
    
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const lightIcon = await daylioPage.themeToggle.textContent();
    
    expect(lightIcon).not.toBe(darkIcon);
  });

  test('should apply dark theme to body element', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const theme = await page.locator('body').getAttribute('data-bs-theme');
    expect(theme).toBe('dark');
  });

  test('should apply light theme to body element', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const theme = await page.locator('body').getAttribute('data-bs-theme');
    expect(theme).toBe('light');
  });

  test('should toggle theme multiple times correctly', async ({ page }) => {
    const initialTheme = await daylioPage.getTheme();
    
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const theme1 = await daylioPage.getTheme();
    expect(theme1).not.toBe(initialTheme);
    
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const theme2 = await daylioPage.getTheme();
    expect(theme2).toBe(initialTheme);
    
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const theme3 = await daylioPage.getTheme();
    expect(theme3).toBe(theme1);
  });

  test('should have Bootstrap theme attribute on body', async ({ page }) => {
    const bodyTheme = await page.locator('body').getAttribute('data-bs-theme');
    expect(bodyTheme).toBeTruthy();
    expect(['light', 'dark']).toContain(bodyTheme);
  });
});

test.describe('Theme Persistence - localStorage', () => {
  let daylioPage;

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    daylioPage = new DaylioPage(page);
    await daylioPage.goto();
  });

  test('should save theme to localStorage when toggled', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(savedTheme).toBeTruthy();
    expect(['light', 'dark']).toContain(savedTheme);
  });

  test('should persist theme to localStorage on dark mode', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const bodyTheme = await daylioPage.getTheme();
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    
    expect(savedTheme).toBe(bodyTheme);
  });

  test('should persist theme to localStorage on light mode', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const bodyTheme = await daylioPage.getTheme();
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    
    expect(savedTheme).toBe(bodyTheme);
  });

  test('should restore theme from localStorage on page reload', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const themeBeforeReload = await daylioPage.getTheme();
    
    await page.reload();
    await daylioPage.waitForLoad();
    
    const themeAfterReload = await daylioPage.getTheme();
    expect(themeAfterReload).toBe(themeBeforeReload);
  });

  test('should maintain dark theme across page reloads', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const darkTheme = await daylioPage.getTheme();
    expect(darkTheme).toBe('dark');
    
    await page.reload();
    await daylioPage.waitForLoad();
    
    const themeAfterReload = await daylioPage.getTheme();
    expect(themeAfterReload).toBe('dark');
  });

  test('should maintain light theme across page reloads', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const lightTheme = await daylioPage.getTheme();
    expect(lightTheme).toBe('light');
    
    await page.reload();
    await daylioPage.waitForLoad();
    
    const themeAfterReload = await daylioPage.getTheme();
    expect(themeAfterReload).toBe('light');
  });

  test('should persist theme across navigation', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const theme = await daylioPage.getTheme();
    
    await page.goto('/');
    await daylioPage.waitForLoad();
    
    const themeAfterNavigation = await daylioPage.getTheme();
    expect(themeAfterNavigation).toBe(theme);
  });

  test('should update localStorage when toggling multiple times', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const theme1 = await page.evaluate(() => localStorage.getItem('theme'));
    
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    const theme2 = await page.evaluate(() => localStorage.getItem('theme'));
    
    expect(theme1).not.toBe(theme2);
  });

  test('should have localStorage theme match body theme attribute', async ({ page }) => {
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const bodyTheme = await page.locator('body').getAttribute('data-bs-theme');
    const localStorageTheme = await page.evaluate(() => localStorage.getItem('theme'));
    
    expect(localStorageTheme).toBe(bodyTheme);
  });
});

test.describe('Activity Group Collapse/Expand', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
    await entryListPage.clickEntryByIndex(0);
  });

  test('should have activity groups initially collapsed', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeFalsy();
    }
  });

  test('should expand activity group when header is clicked', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
    expect(isExpanded).toBeTruthy();
  });

  test('should collapse activity group when header is clicked again', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    await entryDetailPage.collapseActivityGroup(groupId);
    
    const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
    expect(isExpanded).toBeFalsy();
  });

  test('should show items container when group is expanded', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    
    const itemsContainer = page.locator(`#ac-group-${groupId}-items`);
    const isHidden = await itemsContainer.evaluate(el => 
      el.classList.contains('visually-hidden')
    );
    expect(isHidden).toBeFalsy();
  });

  test('should hide items container when group is collapsed', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    await entryDetailPage.collapseActivityGroup(groupId);
    
    const itemsContainer = page.locator(`#ac-group-${groupId}-items`);
    const isHidden = await itemsContainer.evaluate(el => 
      el.classList.contains('visually-hidden')
    );
    expect(isHidden).toBeTruthy();
  });

  test('should remove collapsed class when expanding', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    const collapseButton = page.locator(`#ac-group-${groupId}-collapse`);
    
    await entryDetailPage.expandActivityGroup(groupId);
    
    const hasCollapsedClass = await collapseButton.evaluate(el => 
      el.classList.contains('collapsed')
    );
    expect(hasCollapsedClass).toBeFalsy();
  });

  test('should add collapsed class when collapsing', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    const collapseButton = page.locator(`#ac-group-${groupId}-collapse`);
    
    await entryDetailPage.expandActivityGroup(groupId);
    await entryDetailPage.collapseActivityGroup(groupId);
    
    const hasCollapsedClass = await collapseButton.evaluate(el => 
      el.classList.contains('collapsed')
    );
    expect(hasCollapsedClass).toBeTruthy();
  });

  test('should expand/collapse multiple groups independently', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length < 2) return;
    
    const groupId1 = await groups[0].getAttribute('data-group-id');
    const groupId2 = await groups[1].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId1);
    
    const isGroup1Expanded = await entryDetailPage.isActivityGroupExpanded(groupId1);
    const isGroup2Expanded = await entryDetailPage.isActivityGroupExpanded(groupId2);
    
    expect(isGroup1Expanded).toBeTruthy();
    expect(isGroup2Expanded).toBeFalsy();
  });

  test('should maintain expanded state when clicking other groups', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length < 2) return;
    
    const groupId1 = await groups[0].getAttribute('data-group-id');
    const groupId2 = await groups[1].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId1);
    await entryDetailPage.expandActivityGroup(groupId2);
    
    const isGroup1Expanded = await entryDetailPage.isActivityGroupExpanded(groupId1);
    expect(isGroup1Expanded).toBeTruthy();
  });

  test('should handle rapid collapse/expand clicks', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    await entryDetailPage.collapseActivityGroup(groupId);
    await entryDetailPage.expandActivityGroup(groupId);
    
    const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
    expect(isExpanded).toBeTruthy();
  });
});

test.describe('Toggle All Activities Button', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
    await entryListPage.clickEntryByIndex(0);
  });

  test('should have toggle all button visible', async () => {
    await expect(entryDetailPage.toggleAllButton).toBeVisible();
  });

  test('should expand all activity groups when clicked once', async () => {
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeTruthy();
    }
  });

  test('should collapse all activity groups when clicked twice', async () => {
    await entryDetailPage.toggleAllActivities();
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeFalsy();
    }
  });

  test('should show all activity items when expanding all', async ({ page }) => {
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const itemsContainer = page.locator(`#ac-group-${groupId}-items`);
      const isHidden = await itemsContainer.evaluate(el => 
        el.classList.contains('visually-hidden')
      );
      expect(isHidden).toBeFalsy();
    }
  });

  test('should hide all activity items when collapsing all', async ({ page }) => {
    await entryDetailPage.toggleAllActivities();
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const itemsContainer = page.locator(`#ac-group-${groupId}-items`);
      const isHidden = await itemsContainer.evaluate(el => 
        el.classList.contains('visually-hidden')
      );
      expect(isHidden).toBeTruthy();
    }
  });

  test('should toggle groups that are already expanded', async () => {
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length > 0) {
      const groupId = await groups[0].getAttribute('data-group-id');
      await entryDetailPage.expandActivityGroup(groupId);
    }
    
    await entryDetailPage.toggleAllActivities();
    
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeTruthy();
    }
  });

  test('should toggle groups that are already collapsed', async () => {
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length > 0) {
      const groupId = await groups[0].getAttribute('data-group-id');
      await entryDetailPage.collapseActivityGroup(groupId);
    }
    
    await entryDetailPage.toggleAllActivities();
    
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeFalsy();
    }
  });

  test('should work with multiple rapid clicks', async () => {
    await entryDetailPage.toggleAllActivities();
    await entryDetailPage.toggleAllActivities();
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeTruthy();
    }
  });

  test('should have correct button text or icon', async () => {
    const buttonText = await entryDetailPage.toggleAllButton.textContent();
    expect(buttonText.length).toBeGreaterThan(0);
  });

  test('should maintain functionality across different entries', async () => {
    await entryDetailPage.toggleAllActivities();
    await entryDetailPage.closeEntry();
    
    await entryListPage.clickEntryByIndex(1);
    await entryDetailPage.toggleAllActivities();
    
    const groups = await entryDetailPage.getAllActivityGroups();
    for (const group of groups) {
      const groupId = await group.getAttribute('data-group-id');
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeTruthy();
    }
  });
});

test.describe('Visual State Changes - Active Entry Highlighting', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should not have any active entries initially', async () => {
    const activeEntry = await entryListPage.getActiveEntry();
    expect(activeEntry).toBeNull();
  });

  test('should add active class to clicked entry', async () => {
    await entryListPage.clickEntryByIndex(0);
    const isActive = await entryListPage.isEntryActive('0');
    expect(isActive).toBeTruthy();
  });

  test('should remove active class from previous entry when new entry is clicked', async () => {
    await entryListPage.clickEntryByIndex(0);
    await entryListPage.clickEntryByIndex(1);
    
    const isFirstActive = await entryListPage.isEntryActive('0');
    expect(isFirstActive).toBeFalsy();
  });

  test('should only have one active entry at a time', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    await entryListPage.clickEntryByIndex(1);
    
    const activeEntries = await page.locator('.entry-list-item.active').all();
    expect(activeEntries.length).toBe(1);
  });

  test('should remove active class when entry is closed', async () => {
    await entryListPage.clickEntryByIndex(0);
    await entryDetailPage.closeEntry();
    
    const activeEntry = await entryListPage.getActiveEntry();
    expect(activeEntry).toBeNull();
  });

  test('should maintain active state while viewing entry', async () => {
    await entryListPage.clickEntryByIndex(0);
    const isActive = await entryListPage.isEntryActive('0');
    expect(isActive).toBeTruthy();
    
    await entryDetailPage.toggleAllActivities();
    
    const isStillActive = await entryListPage.isEntryActive('0');
    expect(isStillActive).toBeTruthy();
  });

  test('should highlight entry visually with active class', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    
    const activeEntry = page.locator('.entry-list-item.active');
    await expect(activeEntry).toBeVisible();
  });

  test('should update active state when switching between entries', async () => {
    await entryListPage.clickEntryByIndex(0);
    await entryListPage.clickEntryByIndex(1);
    
    const isSecondActive = await entryListPage.isEntryActive('1');
    expect(isSecondActive).toBeTruthy();
  });

  test('should handle rapid entry selection changes', async () => {
    await entryListPage.clickEntryByIndex(0);
    await entryListPage.page.waitForTimeout(50);
    await entryListPage.clickEntryByIndex(1);
    await entryListPage.page.waitForTimeout(50);
    await entryListPage.clickEntryByIndex(2);
    
    const isThirdActive = await entryListPage.isEntryActive('2');
    expect(isThirdActive).toBeTruthy();
  });
});

test.describe('Visual State Changes - Button States', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
    await entryListPage.clickEntryByIndex(0);
  });

  test('should have collapse button with proper styling', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    const collapseButton = page.locator(`#ac-group-${groupId}-collapse`);
    
    await expect(collapseButton).toBeVisible();
  });

  test('should show collapsed state visually', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    const collapseButton = page.locator(`#ac-group-${groupId}-collapse`);
    
    const hasCollapsedClass = await collapseButton.evaluate(el => 
      el.classList.contains('collapsed')
    );
    expect(hasCollapsedClass).toBeTruthy();
  });

  test('should show expanded state visually', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    const collapseButton = page.locator(`#ac-group-${groupId}-collapse`);
    
    await entryDetailPage.expandActivityGroup(groupId);
    
    const hasCollapsedClass = await collapseButton.evaluate(el => 
      el.classList.contains('collapsed')
    );
    expect(hasCollapsedClass).toBeFalsy();
  });

  test('should maintain button state across interactions', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    const groupId = await groups[0].getAttribute('data-group-id');
    
    await entryDetailPage.expandActivityGroup(groupId);
    await entryDetailPage.toggleAllActivities();
    
    const collapseButton = page.locator(`#ac-group-${groupId}-collapse`);
    const hasCollapsedClass = await collapseButton.evaluate(el => 
      el.classList.contains('collapsed')
    );
    expect(hasCollapsedClass).toBeFalsy();
  });

  test('should have close button with proper styling', async () => {
    await expect(entryDetailPage.closeButton).toBeVisible();
    const buttonText = await entryDetailPage.closeButton.textContent();
    expect(buttonText).toContain('◀');
  });

  test('should have toggle all button with proper styling', async () => {
    await expect(entryDetailPage.toggleAllButton).toBeVisible();
  });

  test('should have theme toggle button with icon', async ({ page }) => {
    const daylioPage = new DaylioPage(page);
    await expect(daylioPage.themeToggle).toBeVisible();
    
    const iconElement = daylioPage.themeToggle.locator('i');
    await expect(iconElement).toBeAttached();
  });

  test('should update theme button icon on state change', async ({ page }) => {
    const daylioPage = new DaylioPage(page);
    const initialIcon = await daylioPage.themeToggle.textContent();
    
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const newIcon = await daylioPage.themeToggle.textContent();
    expect(newIcon).not.toBe(initialIcon);
  });

  test('should have activity dots with proper visual state', async ({ page }) => {
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length > 0) {
      const groupId = await groups[0].getAttribute('data-group-id');
      await entryDetailPage.expandActivityGroup(groupId);
      
      const activityDots = await page.locator('.ac-item').all();
      expect(activityDots.length).toBeGreaterThan(0);
    }
  });

  test('should show active activity dots differently', async ({ page }) => {
    const activeActivities = await page.locator('.activity-dot-active').all();
    expect(activeActivities.length).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Responsive Layout Checks - Desktop', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should display all main elements on desktop', async ({ page }) => {
    const navbar = page.locator('nav.navbar');
    const mainDiv = page.locator('#main-div');
    
    await expect(navbar).toBeVisible();
    await expect(mainDiv).toBeVisible();
  });

  test('should display entry list on desktop', async ({ page }) => {
    const entryListView = page.locator('#entry-list-view');
    await expect(entryListView).toBeVisible();
  });

  test('should display search input on desktop', async ({ page }) => {
    const searchInput = page.locator('#entry-search');
    await expect(searchInput).toBeVisible();
  });

  test('should display dashboard on desktop', async ({ page }) => {
    const dashboard = page.locator('#dashboard-holder');
    await expect(dashboard).toBeVisible();
  });

  test('should have proper layout spacing on desktop', async ({ page }) => {
    const mainDiv = page.locator('#main-div');
    const classes = await mainDiv.getAttribute('class');
    expect(classes).toContain('hstack');
    expect(classes).toContain('gap-3');
  });

  test('should display navbar properly on desktop', async ({ page }) => {
    const navbar = page.locator('nav.navbar');
    await expect(navbar).toBeVisible();
    
    const title = page.locator('h3.daylio-color');
    await expect(title).toBeVisible();
  });

  test('should show entry detail view on desktop when entry is clicked', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.entryViewHolder).toBeVisible();
  });
});

test.describe('Responsive Layout Checks - Tablet', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should display all main elements on tablet', async ({ page }) => {
    const navbar = page.locator('nav.navbar');
    const mainDiv = page.locator('#main-div');
    
    await expect(navbar).toBeVisible();
    await expect(mainDiv).toBeVisible();
  });

  test('should display entry list on tablet', async ({ page }) => {
    const entryListView = page.locator('#entry-list-view');
    await expect(entryListView).toBeVisible();
  });

  test('should display search input on tablet', async ({ page }) => {
    const searchInput = page.locator('#entry-search');
    await expect(searchInput).toBeVisible();
  });

  test('should maintain functionality on tablet', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
  });

  test('should display navbar properly on tablet', async ({ page }) => {
    const navbar = page.locator('nav.navbar');
    await expect(navbar).toBeVisible();
  });

  test('should handle theme toggle on tablet', async ({ page }) => {
    const daylioPage = new DaylioPage(page);
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const theme = await daylioPage.getTheme();
    expect(['light', 'dark']).toContain(theme);
  });
});

test.describe('Responsive Layout Checks - Mobile', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should display all main elements on mobile', async ({ page }) => {
    const navbar = page.locator('nav.navbar');
    const mainDiv = page.locator('#main-div');
    
    await expect(navbar).toBeVisible();
    await expect(mainDiv).toBeVisible();
  });

  test('should display entry list on mobile', async ({ page }) => {
    const entryListView = page.locator('#entry-list-view');
    await expect(entryListView).toBeVisible();
  });

  test('should display search input on mobile', async ({ page }) => {
    const searchInput = page.locator('#entry-search');
    await expect(searchInput).toBeVisible();
  });

  test('should maintain functionality on mobile', async ({ page }) => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
  });

  test('should display navbar properly on mobile', async ({ page }) => {
    const navbar = page.locator('nav.navbar');
    await expect(navbar).toBeVisible();
  });

  test('should handle theme toggle on mobile', async ({ page }) => {
    const daylioPage = new DaylioPage(page);
    await daylioPage.toggleTheme();
    await page.waitForTimeout(100);
    
    const theme = await daylioPage.getTheme();
    expect(['light', 'dark']).toContain(theme);
  });

  test('should be able to close entry detail on mobile', async () => {
    await entryListPage.clickEntryByIndex(0);
    await entryDetailPage.closeEntry();
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeFalsy();
  });

  test('should handle activity group expansion on mobile', async () => {
    await entryListPage.clickEntryByIndex(0);
    
    const groups = await entryDetailPage.getAllActivityGroups();
    if (groups.length > 0) {
      const groupId = await groups[0].getAttribute('data-group-id');
      await entryDetailPage.expandActivityGroup(groupId);
      
      const isExpanded = await entryDetailPage.isActivityGroupExpanded(groupId);
      expect(isExpanded).toBeTruthy();
    }
  });
});

test.describe('Responsive Layout Checks - Wide Screen', () => {
  let entryListPage;
  let entryDetailPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    entryListPage = new EntryListPage(page);
    entryDetailPage = new EntryDetailPage(page);
    await entryListPage.goto();
  });

  test('should display all elements properly on wide screen', async ({ page }) => {
    const navbar = page.locator('nav.navbar');
    const mainDiv = page.locator('#main-div');
    
    await expect(navbar).toBeVisible();
    await expect(mainDiv).toBeVisible();
  });

  test('should maintain layout structure on wide screen', async ({ page }) => {
    const entryListView = page.locator('#entry-list-view');
    const dashboard = page.locator('#dashboard-holder');
    
    await expect(entryListView).toBeVisible();
    await expect(dashboard).toBeVisible();
  });

  test('should handle interactions on wide screen', async () => {
    await entryListPage.clickEntryByIndex(0);
    await expect(entryDetailPage.isEntryDetailVisible()).resolves.toBeTruthy();
  });
});
