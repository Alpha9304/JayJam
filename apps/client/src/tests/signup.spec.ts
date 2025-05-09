import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';

test.describe('Sign Up Page', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_CONFIG.frontendUrl}/sign-up`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render the signup form', async ({ page }) => {
    await expect(page.getByTestId('signup-title')).toBeVisible();
    await expect(page.getByTestId('signup-subtitle')).toBeVisible();
    await expect(page.getByTestId('input-full-name')).toBeVisible();
    await expect(page.getByTestId('input-email')).toBeVisible();
    await expect(page.getByTestId('input-password')).toBeVisible();
    await expect(page.getByTestId('input-confirm-password')).toBeVisible();
    await expect(page.getByTestId('button-complete-registration')).toBeVisible();
    await expect(page.getByTestId('link-login')).toBeVisible();
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.getByTestId('input-full-name').fill('John Doe');
    await page.getByTestId('input-email').fill('notvalidemail@gmail.com');
    await page.getByTestId('input-password').fill('Password1!');
    await page.getByTestId('input-confirm-password').fill('Password1!');
    await page.getByTestId('button-complete-registration').click();

    await expect(page.getByText(/Please enter a valid JHU email/i)).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.getByTestId('input-full-name').fill('John Doe');
    await page.getByTestId('input-email').fill('test@jhu.edu');
    await page.getByTestId('input-password').fill('Password1!');
    await page.getByTestId('input-confirm-password').fill('Password2!');
    await page.getByTestId('button-complete-registration').click();

    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
  });

  test('should validate weak password', async ({ page }) => {
    await page.getByTestId('input-full-name').fill('John Doe');
    await page.getByTestId('input-email').fill('test@jhu.edu');
    await page.getByTestId('input-password').fill('short');
    await page.getByTestId('input-confirm-password').fill('short');
    await page.getByTestId('button-complete-registration').click();

    await expect(page.getByText(/Password does not meet security requirements/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByTestId('input-password');
    const confirmPasswordInput = page.getByTestId('input-confirm-password');

    // Initially hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Toggle password visibility
    await page.getByTestId('toggle-password-visibility').click();
    await page.getByTestId('toggle-confirm-password-visibility').click();

    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  test('should allow navigation to login page', async ({ page }) => {
    await page.getByTestId('link-login').click();
    await page.waitForURL(`${TEST_CONFIG.frontendUrl}/`); // Adjust if login page is different
  });

});
