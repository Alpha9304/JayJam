import { test, expect } from '@playwright/test'; //"playwright-test-coverage"; //'playwright-test-coverage-native';
import { TEST_CONFIG } from './config';
//command close on coverage: pnpm c8 --reporter=lcov --reporter=text --all --include=src/**/*.ts --include=src/**/*.tsx npx playwright test reset.spec.ts -c playwright.config.ts 
const TESTER_EMAIL = "flastname2@jhu.edu"; //change this to whoever is testing right now or a fake email
const TESTER_NAME = "Test Name";
let userId = -1;
const userPassword = "CTester-Password1!";

//create a sample user in the db
test.beforeEach(async () => {
  const response = await fetch(`${TEST_CONFIG.backendUrl}/create-user-unverified`, {
    method: 'POST',
    body: JSON.stringify({ name: TESTER_NAME, email: TESTER_EMAIL, password: userPassword }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  const data = await response.json();
  userId = data.userId;
});


//remove the sample user from the db
test.afterEach(async () => {
  await fetch(`${TEST_CONFIG.backendUrl}/delete-user`, {
    method: 'POST',
    body: JSON.stringify({ email: TESTER_EMAIL }),
    headers: { 'Content-Type': 'application/json' },
  });
});

test('Ensure basic reset password flow is correctly working', async ({ page }) => {

  await page.goto(`${TEST_CONFIG.frontendUrl}/reset`);
  
  // Expect the email input filed to be visible when the page is first visited
  await expect(page.getByTestId('email_input')).toBeVisible();

  // Expect the send code button to be ready for use when the page is first visited
  await expect(page.getByTestId('send_code_ready')).toBeVisible();

  // Expect the verification code input to be visible when the page is first visited
  await expect(page.getByTestId('code_input')).toBeVisible();

  // Expect the verification code button to be visible when the page is first visited
  await expect(page.getByTestId('verify_code_btn')).toBeVisible();

  // Expect the password input field to not be visible when the page is first visited
  await expect(page.getByTestId('password_input')).toBeHidden();

  // Expect the confirm password input field to not be visible when the page is first visited
  await expect(page.getByTestId('confirm_password_input')).toBeHidden();

  // Expect the set new password button to not be visible when the page is first visited
  await expect(page.getByTestId('reset_btn')).toBeHidden();

  //Enter email and click send code button
  await page.getByTestId('email_input_field').fill(TESTER_EMAIL);

  await page.getByTestId('send_code_ready').click();

  // Expect the wait to resend code button to be shown after the code is sent 
  await expect(page.getByTestId('send_code_wait')).toBeVisible();

  // Expect the check spam notifcation to be shown after the code is sent 
  await expect(page.getByTestId('check_spam')).toBeVisible();

  //get and enter input code sent to user
  const response = await fetch(`${TEST_CONFIG.backendUrl}/get-verification-code`, {
    method: 'POST',
    body: JSON.stringify({ userId: userId }),
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get verification code');
  }
  
  const data = await response.json();
  const code = data.code;

  const codeString = String(code);

  for(let i = 0; i < codeString.length; i++) {
    await page.getByTestId('code_input_field').nth(i).fill(codeString[i]);
  }

  await page.getByTestId('verify_code_btn').click();

  // Expect the email input field to be hidden after verifcation is over
  await expect(page.getByTestId('email_input')).toBeHidden();

  // Expect the send code button to be hidden after verifcation is over
  await expect(page.getByTestId('send_code_ready')).toBeHidden();

  // Expect the verification code input to be hidden when verifcation is over
  await expect(page.getByTestId('code_input')).toBeHidden();

  // Expect the verification code button to be  hidden when verifcation is over
  await expect(page.getByTestId('verify_code_btn')).toBeHidden();
    
  // Expect the password input field to be visible when verification is over
  await expect(page.getByTestId('password_input')).toBeVisible();

  // Expect the confirm password input field to be visible when verification is over
  await expect(page.getByTestId('confirm_password_input')).toBeVisible();

  // Expect the set new password button to be visible when verification is over
  await expect(page.getByTestId('reset_btn')).toBeVisible();

  //fill password and submit
  await page.getByTestId('password_input_field').fill("New-Password1!");
  await page.getByTestId('confirm_password_input_field').fill("New-Password1!");

  await page.getByTestId("reset_btn").click();

  //should be on login page now
  await expect(page).toHaveURL(`${TEST_CONFIG.frontendUrl}/`);
});



test('Ensure reset password flow with resend code is correctly working', async ({ page }) => {

  await page.goto(`${TEST_CONFIG.frontendUrl}/reset`);
  
  // Expect the email input filed to be visible when the page is first visited
  await expect(page.getByTestId('email_input')).toBeVisible();

  // Expect the send code button to be ready for use when the page is first visited
  await expect(page.getByTestId('send_code_ready')).toBeVisible();

  // Expect the verification code input to be visible when the page is first visited
  await expect(page.getByTestId('code_input')).toBeVisible();

  // Expect the verification code button to be visible when the page is first visited
  await expect(page.getByTestId('verify_code_btn')).toBeVisible();

  // Expect the password input field to not be visible when the page is first visited
  await expect(page.getByTestId('password_input')).toBeHidden();

  // Expect the confirm password input field to not be visible when the page is first visited
  await expect(page.getByTestId('confirm_password_input')).toBeHidden();

  // Expect the set new password button to not be visible when the page is first visited
  await expect(page.getByTestId('reset_btn')).toBeHidden();

  //Enter email and click send code button
  await page.getByTestId('email_input_field').fill(TESTER_EMAIL);

  await page.getByTestId('send_code_ready').click();

  // Expect the wait to resend code button to be shown after the code is sent 
  await expect(page.getByTestId('send_code_wait')).toBeVisible();

  // Expect the check spam notifcation to be shown after the code is sent 
  await expect(page.getByTestId('check_spam')).toBeVisible();

  // Should be able to send new code after 30 seconds have passed
  setTimeout(async () => {
    await page.getByTestId('send_code_ready').click();
  }, 30000);

  //get and enter input code sent to user
  const response = await fetch(`${TEST_CONFIG.backendUrl}/get-verification-code`, {
    method: 'POST',
    body: JSON.stringify({ userId: userId }),
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get verification code');
  }
  
  const data = await response.json();
  const code = data.code;

  const codeString = String(code);

  for(let i = 0; i < codeString.length; i++) {
    await page.getByTestId('code_input_field').nth(i).fill(codeString[i]);
  }

  await page.getByTestId('verify_code_btn').click();

  // Expect the email input field to be hidden after verifcation is over
  await expect(page.getByTestId('email_input')).toBeHidden();

  // Expect the send code button to be hidden after verifcation is over
  await expect(page.getByTestId('send_code_ready')).toBeHidden();

  // Expect the verification code input to be hidden when verifcation is over
  await expect(page.getByTestId('code_input')).toBeHidden();

  // Expect the verification code button to be  hidden when verifcation is over
  await expect(page.getByTestId('verify_code_btn')).toBeHidden();
    
  // Expect the password input field to be visible when verification is over
  await expect(page.getByTestId('password_input')).toBeVisible();

  // Expect the confirm password input field to be visible when verification is over
  await expect(page.getByTestId('confirm_password_input')).toBeVisible();

  // Expect the set new password button to be visible when verification is over
  await expect(page.getByTestId('reset_btn')).toBeVisible();

  //fill password and submit
  await page.getByTestId('password_input_field').fill("New-Password1!");
  await page.getByTestId('confirm_password_input_field').fill("New-Password1!");

  await page.getByTestId("reset_btn").click();

  //should be on login page now
  await expect(page).toHaveURL(`${TEST_CONFIG.frontendUrl}/`);
});


test('Ensure reset password does not proceed if incorrect confirm password is entered', async ({ page }) => {

  await page.goto(`${TEST_CONFIG.frontendUrl}/reset`);
  
  // Expect the email input filed to be visible when the page is first visited
  await expect(page.getByTestId('email_input')).toBeVisible();

  // Expect the send code button to be ready for use when the page is first visited
  await expect(page.getByTestId('send_code_ready')).toBeVisible();

  // Expect the verification code input to be visible when the page is first visited
  await expect(page.getByTestId('code_input')).toBeVisible();

  // Expect the verification code button to be visible when the page is first visited
  await expect(page.getByTestId('verify_code_btn')).toBeVisible();

  // Expect the password input field to not be visible when the page is first visited
  await expect(page.getByTestId('password_input')).toBeHidden();

  // Expect the confirm password input field to not be visible when the page is first visited
  await expect(page.getByTestId('confirm_password_input')).toBeHidden();

  // Expect the set new password button to not be visible when the page is first visited
  await expect(page.getByTestId('reset_btn')).toBeHidden();

  //Enter email and click send code button
  await page.getByTestId('email_input_field').fill(TESTER_EMAIL);

  await page.getByTestId('send_code_ready').click();

  // Expect the wait to resend code button to be shown after the code is sent 
  await expect(page.getByTestId('send_code_wait')).toBeVisible();

  // Expect the check spam notifcation to be shown after the code is sent 
  await expect(page.getByTestId('check_spam')).toBeVisible();

  //get and enter input code sent to user
  const response = await fetch(`${TEST_CONFIG.backendUrl}/get-verification-code`, {
    method: 'POST',
    body: JSON.stringify({ userId: userId }),
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get verification code');
  }
  
  const data = await response.json();
  const code = data.code;

  const codeString = String(code);

  for(let i = 0; i < codeString.length; i++) {
    await page.getByTestId('code_input_field').nth(i).fill(codeString[i]);
  }

  await page.getByTestId('verify_code_btn').click();

  // Expect the email input field to be hidden after verifcation is over
  await expect(page.getByTestId('email_input')).toBeHidden();

  // Expect the send code button to be hidden after verifcation is over
  await expect(page.getByTestId('send_code_ready')).toBeHidden();

  // Expect the verification code input to be hidden when verifcation is over
  await expect(page.getByTestId('code_input')).toBeHidden();

  // Expect the verification code button to be  hidden when verifcation is over
  await expect(page.getByTestId('verify_code_btn')).toBeHidden();
    
  // Expect the password input field to be visible when verification is over
  await expect(page.getByTestId('password_input')).toBeVisible();

  // Expect the confirm password input field to be visible when verification is over
  await expect(page.getByTestId('confirm_password_input')).toBeVisible();

  // Expect the set new password button to be visible when verification is over
  await expect(page.getByTestId('reset_btn')).toBeVisible();

  //fill password and submit
  await page.getByTestId('password_input_field').fill("New-Password1!");
  await page.getByTestId('confirm_password_input_field').fill("New-Password!");

  await page.getByTestId("reset_btn").click();

  //should not proceed and should show toast error
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await expect(page).toHaveURL(`${TEST_CONFIG.frontendUrl}/reset`);
});


test('Ensure reset password does not proceed if incomplete verification code is entered', async ({ page }) => {

  await page.goto(`${TEST_CONFIG.frontendUrl}/reset`);
  
  // Expect the email input filed to be visible when the page is first visited
  await expect(page.getByTestId('email_input')).toBeVisible();

  // Expect the send code button to be ready for use when the page is first visited
  await expect(page.getByTestId('send_code_ready')).toBeVisible();

  // Expect the verification code input to be visible when the page is first visited
  await expect(page.getByTestId('code_input')).toBeVisible();

  // Expect the verification code button to be visible when the page is first visited
  await expect(page.getByTestId('verify_code_btn')).toBeVisible();

  // Expect the password input field to not be visible when the page is first visited
  await expect(page.getByTestId('password_input')).toBeHidden();

  // Expect the confirm password input field to not be visible when the page is first visited
  await expect(page.getByTestId('confirm_password_input')).toBeHidden();

  // Expect the set new password button to not be visible when the page is first visited
  await expect(page.getByTestId('reset_btn')).toBeHidden();

  //Enter email and click send code button
  await page.getByTestId('email_input_field').fill(TESTER_EMAIL);

  await page.getByTestId('send_code_ready').click();

  // Expect the wait to resend code button to be shown after the code is sent 
  await expect(page.getByTestId('send_code_wait')).toBeVisible();

  // Expect the check spam notifcation to be shown after the code is sent 
  await expect(page.getByTestId('check_spam')).toBeVisible();

  //get and enter short code
  const response = await fetch(`${TEST_CONFIG.backendUrl}/get-verification-code`, {
    method: 'POST',
    body: JSON.stringify({ userId: userId }),
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get verification code');
  }
  
  const data = await response.json();
  const code = data.code;

  const codeString = String(code);

  for(let i = 0; i < codeString.length - 3; i++) {
    await page.getByTestId('code_input_field').nth(i).fill(codeString[i]);
  }

  await page.getByTestId('verify_code_btn').click();

  //should not proceed and should show toast error
  await expect(page.getByText("Please enter a valid 6-digit code.")).toBeVisible();
  await expect(page).toHaveURL(`${TEST_CONFIG.frontendUrl}/reset`);
});
