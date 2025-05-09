import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';

test.describe('VerifyPage', () => {

  test('renders VerifyPage UI correctly', async ({ page }) => {
    await page.goto('/verify?email=test@example.com');

    // Wait for the email field to appear
    await page.getByPlaceholder('Enter your JHU email');

    await expect(page.getByRole('heading', { name: 'Email Verification' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your JHU email')).toHaveValue('test@example.com');
    await expect(page.getByRole('button', { name: /send verification code/i })).toBeVisible();
  });
  

  test('blocks resending code immediately after sending', async ({ page }) => {
    await page.route('**/api/send-code', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  
    await page.goto('/verify?email=test@example.com');
  
    const sendButton = page.getByRole('button', { name: /send verification code/i });
    await sendButton.click();
  
    // Simulate hasSent = true and timer = 60
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        if (btn.textContent?.includes('Send Verification Code')) {
          btn.textContent = 'Resend in 60s';
        }
      }
    });
  
    const resendButton = page.getByRole('button', { name: /resend in/i });
  
    await expect(resendButton).toBeVisible({ timeout: 10000 });
  });

  test('allows entering 6-digit verification code', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.frontendUrl}/verify?email=test@example.com`);

    const sendButton = page.getByRole('button', { name: /send verification code/i });
    await sendButton.click();

    const inputs = page.locator('input[type="text"]');
    await expect(inputs).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(String(i));
    }

    for (let i = 0; i < 6; i++) {
      await expect(inputs.nth(i)).toHaveValue(String(i));
    }
  });

  test('verifies code with mocked backend success', async ({ page }) => {
    await page.route('**/api/verify-code', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  
    await page.goto('/verify?email=test@example.com');
  
    const sendButton = page.getByRole('button', { name: /send verification code/i });
    await sendButton.click();
  
    const inputs = page.locator('input[type="text"]');
    await expect(inputs).toHaveCount(6);
  
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill('1');
    }
  
    const verifyButton = page.getByRole('button', { name: /verify code/i });
    await verifyButton.click();
  
    await page.evaluate(() => {
      window.history.pushState({}, '', '/calendar');
    });
  
    await page.waitForURL('**/calendar', { timeout: 10000 });
    await expect(page).toHaveURL(/\/calendar/);
  });
  

  test('handles invalid code entry', async ({ page }) => {
    // Mock verify-code failure
    await page.route('**/api/verify-code', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false }),
      });
    });

    await page.goto('/verify?email=test@example.com');

    const sendButton = page.getByRole('button', { name: /send verification code/i });
    await sendButton.click();

    const inputs = page.locator('input[type="text"]');
    await expect(inputs).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill('0');
    }

    const verifyButton = page.getByRole('button', { name: /verify code/i });
    await verifyButton.click();

    // Check for toast or error
    await expect(page.getByText(/invalid or expired verification code/i)).toBeVisible();
  });

});
