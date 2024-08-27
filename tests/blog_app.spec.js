const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, addBlog } = require('./helper')

describe('Bloglist app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await request.post('/api/users', {
      data: {
        name: 'Sherlock Holmes',
        username: 'holmes',
        password: 'baskerville'
      }
    })
    await request.post('/api/users', {
      data: {
        name: 'James Bond',
        username: 'bond007',
        password: 'skyfall'
      }
    })
    await page.goto('/')
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

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'holmes', 'baskerville')
    })

    test('a new blog can be added', async ({ page }) => {
      await addBlog(page, 'Adventures of Sherlock Holmes', 'John H. Watson', 'b221.co.uk')
      await expect(page.getByText('Adventures of Sherlock Holmes by John H. Watson')).toBeVisible()
    })

    test('a blog can be liked', async ({ page }) => {
      await addBlog(page, 'Adventures of Sherlock Holmes', 'John H. Watson', 'b221.co.uk')
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('Likes: 0')).toBeVisible()
      await page.getByRole('button', { name: 'like' }).click()
      await expect(page.getByText('Likes: 1')).toBeVisible()
    })

    test('user can delete a blog if it was added by them', async ({ page }) => {
      await addBlog(page, 'Adventures of Sherlock Holmes', 'John H. Watson', 'b221.co.uk')
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('Added by: Sherlock Holmes')).toBeVisible()

      page.on('dialog', async dialog => {
        console.log('Dialog: ', dialog.message());
        await dialog.accept();
      });
      await page.getByRole('button', { name: 'delete' }).click()

      const successDiv = await page.locator('.success')
      await expect(successDiv).toContainText('Blog "Adventures of Sherlock Holmes" was removed')
      await expect(successDiv).toHaveCSS('border-style', 'solid')
      await expect(successDiv).toHaveCSS('color', 'rgb(50, 124, 96)')
      await expect(page.getByText('Added by: Sherlock Holmes')).not.toBeVisible()
    })

    test('user cannot see the delete button for blogs they did not add', async ({ page }) => {
      await addBlog(page, 'Adventures of Sherlock Holmes', 'John H. Watson', 'b221.co.uk')
      await expect(page.getByText('Adventures of Sherlock Holmes by John H. Watson')).toBeVisible()
      await page.getByRole('button', { name: 'logout' }).click()

      await expect(page.getByText('Log in to application')).toBeVisible()
      await loginWith(page, 'bond007', 'skyfall')
      await expect(page.getByText('James Bond logged in')).toBeVisible()

      await expect(page.getByText('Adventures of Sherlock Holmes by John H. Watson')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByRole('button', { name: 'delete' })).not.toBeVisible()
    })
  })
})