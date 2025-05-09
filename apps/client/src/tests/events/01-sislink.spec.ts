import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../config';



test('enter sis link', async ({ page }) => {
  await page.goto(TEST_CONFIG.frontendUrl);
  await page.getByTestId('login_email_input').click();
  await page.getByTestId('login_email_input').fill(TEST_CONFIG.testEmail);
  await page.getByTestId('login_email_input').press('Tab');
  await page.getByTestId('login_password_input').fill(TEST_CONFIG.testPassword);
  await page.getByTestId('login_btn').click();
  await page.getByRole('button', { name: 'SIS Link' }).click();
  await page.getByRole('textbox', { name: 'Paste your SIS link here' }).click();
  await page.getByRole('textbox', { name: 'Paste your SIS link here' }).fill(TEST_CONFIG.sisLink);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('paragraph')).toContainText('Displaying'); //TODO how to assert the number in display is grreater than 0
});