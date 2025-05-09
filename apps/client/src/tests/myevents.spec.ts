import test, { expect } from "@playwright/test";
import { TEST_CONFIG } from './config';

const TESTER_EMAIL = "flastname2@jhu.edu";
const TESTER_NAME = "Test Name";
let userId = -1;
let testEventTitle = "";
let testEventDesc = "";
let testEventId = -1;
const userPassword = "CTester-Password1!";

//create a sample user in the db and add a sample finalized event
test.beforeEach(async ({ page }) => {

  await page.goto(`${TEST_CONFIG.frontendUrl}/`);

  //add sample user
  let response = await fetch(`${TEST_CONFIG.backendUrl}/create-user-verified`, {
    method: 'POST',
    body: JSON.stringify({ name: TESTER_NAME, email: TESTER_EMAIL, password: userPassword }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  let data = await response.json();
  console.log(data);
  userId = data.userId;

  //add sample event
  response = await fetch(`${TEST_CONFIG.backendUrl}/create-finalized-event`, {
    method: 'POST',
    body: JSON.stringify({ userId: userId }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to create event');
  }

  data = await response.json();
  console.log(data);
  testEventTitle = data.eventTitle;
  testEventDesc = data.eventDesc;
  testEventId = data.eventId;

  //log in with the user
  

  await page.getByTestId('login_email_input').fill(TESTER_EMAIL);
  await page.getByTestId('login_password_input').fill(userPassword);
  await page.getByTestId('login_btn').click();

  //go to my events page
  await page.getByTestId('my_events_btn').click();
});

//clean up
test.afterEach(async () => {

  //remove sample user
  await fetch(`${TEST_CONFIG.backendUrl}/delete-user`, {
    method: 'POST',
    body: JSON.stringify({ email: TESTER_EMAIL }),
    headers: { 'Content-Type': 'application/json' },
  });

  //remove sample event 
  await fetch(`${TEST_CONFIG.backendUrl}/delete-finalized-event`, {
    method: 'POST',
    body: JSON.stringify({ eventId: testEventId, userId: userId }),
    headers: { 'Content-Type': 'application/json' },
  });



  //reset variables
  userId = -1;
  testEventTitle = "";
  testEventDesc = "";
  testEventId = -1;
});

test('Ensure successful leave event flow is working', async ({ page }) => {
  //click into finalized events tab
  await page.getByTestId('finalized_tab_btn').click();

  // Expect the test finalized event to be visible on the page
  await expect(page.getByText(testEventTitle)).toBeVisible();
  await expect(page.getByText(testEventDesc)).toBeVisible();

  //click leave event button
  await page.getByTestId('leave_event_btn').click();

  //expect leave event dialog to be visible
  await expect(page.getByTestId('leave_event_dialog')).toBeVisible();

  //click leave event dialog continue button
  await page.getByTestId('leave_event_cont_btn').click();

  //expect leave event dialog to no longer be visible
  await expect(page.getByTestId('leave_event_dialog')).toBeHidden(); 


  // Expect the test finalized event to no longer be on the page
  await expect(page.getByText(testEventTitle)).toBeHidden();
  await expect(page.getByText(testEventDesc)).toBeHidden();

  //clean up, logout the user
  //await page.getByTestId('logout_btn').click();
  
});

test('Ensure successful cancel leave event flow is working from cancel button', async ({ page }) => {
  //click into finalized events tab
  await page.getByTestId('finalized_tab_btn').click();

  // Expect the test finalized event to be visible on the page
  await expect(page.getByText(testEventTitle)).toBeVisible();
  await expect(page.getByText(testEventDesc)).toBeVisible();

  //click leave event button
  await page.getByTestId('leave_event_btn').click();

  //expect leave event dialog to be visible
  await expect(page.getByTestId('leave_event_dialog')).toBeVisible();

  //click leave event dialog continue button
  await page.getByTestId('leave_event_cancel_btn').click();

  //expect leave event dialog to no longer be visible
  await expect(page.getByTestId('leave_event_dialog')).toBeHidden(); 

  //clean up, logout the user
  //await page.getByTestId('logout_btn').click();
  
});

test('Ensure successful cancel leave event flow is working from click outside dialog', async ({ page }) => {
  //click into finalized events tab
  await page.getByTestId('finalized_tab_btn').click();
  
  // Expect the test finalized event to be visible on the page
  await expect(page.getByText(testEventTitle)).toBeVisible();
  await expect(page.getByText(testEventDesc)).toBeVisible();

  //click leave event button
  await page.getByTestId('leave_event_btn').click();

  //expect leave event dialog to be visible
  await expect(page.getByTestId('leave_event_dialog')).toBeVisible();

  // Click outside of the dialog box
  const dialog = page.getByTestId('leave_event_dialog');
  const box = (await dialog.boundingBox())!;
  await page.mouse.click(box.x, box.y + box.y/2);


  //expect leave event dialog to no longer be visible
  await expect(page.getByTestId('leave_event_dialog')).toBeHidden(); 

  //clean up, logout the user
  //await page.getByTestId('logout_btn').click();
  
});