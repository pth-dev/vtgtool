import { test, expect } from '@playwright/test'

test.describe('Dashboard App', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/VTG/)
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
  })

  test('should login as admin', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@vtg.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Data Manager', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@vtg.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
  })

  test('should access data manager page', async ({ page }) => {
    await page.goto('/admin/data-manager')
    await expect(page.getByText(/data manager/i)).toBeVisible()
  })
})

test.describe('Chart Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@vtg.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
  })

  test('should access charts page', async ({ page }) => {
    await page.goto('/admin/charts')
    await expect(page.getByText(/charts/i)).toBeVisible()
  })
})

test.describe('Dashboard Designer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@vtg.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
  })

  test('should access dashboard list', async ({ page }) => {
    await page.goto('/dashboard-list')
    await expect(page.getByText(/dashboards/i)).toBeVisible()
  })

  test('should create new dashboard', async ({ page }) => {
    await page.goto('/dashboard-list')
    await page.click('button:has-text("New Dashboard")')
    await page.fill('input[label="Name"]', 'Test Dashboard')
    await page.click('button:has-text("Create")')
    await expect(page).toHaveURL(/dashboard-designer/)
  })
})

test.describe('Responsive', () => {
  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('img[alt="VTGTOOL"]')).toBeVisible()
  })
})
