const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith } = require('./helper')

describe('Bloglist app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http:localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Sherlock Holmes',
        username: 'holmes',
        password: 'baskerville'
      }
    })
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('Bloglist')).toBeVisible()
    await expect(page.getByText('Log in to application')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'holmes', 'baskerville')
      const userDiv = await page.locator('.user')
      await expect(userDiv).toContainText('Sherlock Holmes logged in')
      await expect(userDiv).toHaveCSS('color', 'rgb(143, 130, 46)')
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'holmes', 'basker')
      await expect(page.getByText('Sherlock Holmes logged in')).not.toBeVisible()
      const errorDiv = await page.locator('.error')
      await expect(errorDiv).toContainText('ERROR: Wrong username or password')
      await expect(errorDiv).toHaveCSS('border-style', 'solid')
      await expect(errorDiv).toHaveCSS('color', 'rgb(143, 46, 46)')
    })
  })
})