import { expect, test } from '@playwright/test'

test('primary grounded search journey works on desktop', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /tell us the feeling/i })).toBeVisible()
  await page.getByRole('button', { name: /search with atlas/i }).click()
  await expect(page.getByText(/grounded matches ranked/i)).toBeVisible()
  await expect(page.getByTestId('result-card')).toHaveCount(3)
  await page.getByTestId('result-card').first().getByRole('button', { name: /view evidence/i }).click()
  await expect(page.getByRole('dialog')).toContainText('Citation ID')
  await page.getByRole('button', { name: /close evidence/i }).click()
  await page.getByTestId('result-card').first().getByRole('button', { name: /^save to trip$/i }).click()
  await expect(page.getByLabel('Trip workspace')).toContainText('Estimated total')
  await page.screenshot({ path: 'artifacts/atlas-results-desktop.png', fullPage: true })
  expect(pageErrors).toEqual([])
})

test('architecture and evaluation views render', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Architecture' }).click()
  await expect(page.getByRole('heading', { name: 'Azure architecture' })).toBeVisible()
  await page.getByRole('button', { name: 'Evaluation' }).click()
  await expect(page.getByRole('heading', { name: 'Relevance, not vibes' })).toBeVisible()
})

test('320px layout has no page-level overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: /search with atlas/i }).click()
  await expect(page.getByTestId('result-card').first()).toBeVisible()
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  expect(fits).toBe(true)
  await page.screenshot({ path: 'artifacts/atlas-results-mobile.png', fullPage: true })
})
