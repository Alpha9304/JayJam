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
  
  // Find the specific event with title "testt" and delete it
  const eventRow = await page.locator('tr', { has: page.getByText('testt') }).first();
  await eventRow.locator('button:has-text("Delete")').click();
  
  // Confirm the deletion
  await expect(page.getByText('Event deleted successfully')).toBeVisible();
  
  // Verify the event with title "testt" is no longer present
  await expect(page.getByText('testt')).not.toBeVisible();
});