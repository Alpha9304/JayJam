import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test('delete event', async ({ page }) => {
  await page.goto(TEST_CONFIG.frontendUrl);
  await page.getByTestId('login_email_input').click();
  await page.getByTestId('login_email_input').fill(TEST_CONFIG.testEmail);
  await page.getByTestId('login_email_input').press('Tab');
  await page.getByTestId('login_password_input').fill(TEST_CONFIG.testPassword);
  await page.getByTestId('login_btn').click();
  await page.getByRole('button', { name: 'My Classes' }).click();
  await page.getByText('View Details').first().click();
  await page.getByRole('tab', { name: 'Pending Events' }).click();
  await page.locator('div:nth-child(2) > button:nth-child(3)').first().click();
  await expect(page.getByText('Event deleted successfully')).toBeVisible();
});