import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test('add message', async ({ page }) => {
  await page.goto(TEST_CONFIG.frontendUrl);
  await page.getByTestId('login_email_input').click();
  await page.getByTestId('login_email_input').fill(TEST_CONFIG.testEmail);
  await page.getByTestId('login_email_input').press('Tab');
  await page.getByTestId('login_password_input').fill(TEST_CONFIG.testPassword);
  await page.getByTestId('login_btn').click();
  await page.getByRole('button', { name: 'My Classes' }).click();
  await page.getByText('View Details').first().click();
  await page.getByRole('tab', { name: 'Pending Events' }).click();
  await page.locator('.text-lg > .inline-flex').first().click();
  await page.getByTestId('chat_text_field').click();
  await page.getByTestId('chat_text_field').fill('Message for reactions');
  await expect(page.getByText('Ethan is typing...')).toBeVisible();
  await page.getByTestId('chat_send_btn').click();
  await expect(page.getByTestId('chat_window').getByRole('button').nth(1)).toBeVisible();
  await expect(page.getByTestId('chat_window').getByRole('button').nth(2)).toBeVisible();
});

