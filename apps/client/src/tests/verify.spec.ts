import { test, expect } from "@playwright/test";

test.describe('VerifyPage', () => {
  
  test('renders VerifyPage UI correctly', async ({ page }) => {
    await page.goto('/verify?email=test@example.com');

    await expect(page.getByRole('heading', { name: 'Email Verification' })).toBeVisible();
    await expect(page.getByLabel('JHU Email Address')).toHaveValue('test@example.com');
    await expect(page.getByRole('button', { name: 'Send Verification Code' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  });

  test('blocks resending code immediately after sending', async ({ page }) => {
    await page.goto('/verify?email=test@example.com');

    const sendButton = page.getByRole('button', { name: 'Send Verification Code' });
    await sendButton.click();

    // After click, either timer or success toast should show
    await expect(page.getByText(/check your junk\/spam folder/i)).toBeVisible();
    await expect(sendButton).toBeDisabled();
  });

  test('allows entering 6-digit verification code', async ({ page }) => {
    await page.goto('/verify?email=test@example.com');

    const sendButton = page.getByRole('button', { name: 'Send Verification Code' });
    await sendButton.click();

    // Wait for inputs to show up
    const firstInput = page.getByRole('textbox').first();
    await expect(firstInput).toBeVisible();

    const inputs = page.locator('input[type="text"]').nth(1);
    await firstInput.fill('1');
    await inputs.fill('2');

    await expect(firstInput).toHaveValue('1');
    await expect(inputs).toHaveValue('2');
  });

  test('verifies code with mocked backend success', async ({ page }) => {
    await page.route('**/api/trpc/verifyCode.verify', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: { data: true } }),
      });
    });

    await page.goto('/verify?email=test@example.com');

    const sendButton = page.getByRole('button', { name: 'Send Verification Code' });
    await sendButton.click();

    // Fill the 6-digit code
    const inputs = page.locator('input[type="text"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill('1');
    }

    const verifyButton = page.getByRole('button', { name: 'Verify Code' });
    await verifyButton.click();

    // After verification, should be redirected to /calendar
    await page.waitForURL('/calendar');
  });

  test('handles invalid code entry', async ({ page }) => {
    await page.goto('/verify?email=test@example.com');

    const sendButton = page.getByRole('button', { name: 'Send Verification Code' });
    await sendButton.click();

    const verifyButton = page.getByRole('button', { name: 'Verify Code' });
    await verifyButton.click();

    // Expect error toast for incomplete code
    await expect(page.getByText(/please enter a valid 6-digit code/i)).toBeVisible();
  });
  
});
