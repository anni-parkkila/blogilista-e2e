const { test, expect } = require('@playwright/test')
const { describe } = require('node:test')

describe('Bloglist app', () => {
  test('front page can be opened', async ({ page }) => {
    await page.goto('http://localhost:5173')

    const locator = await page.getByText('Bloglist')
    await expect(locator).toBeVisible()
    await expect(page.getByText('Log in to application')).toBeVisible()
  })
})