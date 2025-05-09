import test, { expect } from "@playwright/test";
import { TEST_CONFIG } from './config';

const TESTER_EMAIL = "flastname2@jhu.edu";
const TESTER_NAME = "Test Name";
let userId = -1;
let testEventTitle = "";
let testEventDesc = "";
let testEventId = -1;
const testMessageContent = "Hello world!";
const userPassword = "CTester-Password1!";


//create a sample user, sample finalized event, and sample chat (channel), and sample message
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
  userId = data.userId


  //add sample event
  console.log("userid", userId);
  response = await fetch(`${TEST_CONFIG.backendUrl}/create-finalized-event`, {
    method: 'POST',
    body: JSON.stringify({ userId: userId }),
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to create event');
  }

  data = await response.json();
  testEventTitle = data.eventTitle;
  testEventDesc = data.eventDesc;
  testEventId = data.eventId;


  console.log("event", testEventId)
  
  //add sample chat
  response = await fetch(`${TEST_CONFIG.backendUrl}/create-finalized-chat`, {
    method: 'POST',
    body: JSON.stringify({ fEventId: testEventId }),
    headers: { 'Content-Type': 'application/json' },
  });
  

  if (!response.ok) {
    throw new Error('Failed to create chat');
  }

  data = await response.json();

  
  await page.getByTestId('login_email_input').fill(TESTER_EMAIL);
  await page.getByTestId('login_password_input').fill(userPassword);
  await page.getByTestId('login_btn').click();

  //go to my events page
  await page.getByTestId('my_events_btn').click();

  console.log("test title", testEventTitle);
  //expect to be on correct page
  await expect(page).toHaveURL("http://localhost:3002/study-events")


  //go to finalized tab
  await page.getByText("Finalized").click();

  // Expect the test event to be visible on the page  
  await expect(page.getByText(testEventTitle)).toBeVisible(); 
  await expect(page.getByText(testEventDesc)).toBeVisible();
});

//clean up
test.afterEach(async ( { }) => {


  try {

    
    // Remove sample message
    const response = await fetch(`${TEST_CONFIG.backendUrl}/delete-message`, {
      method: 'POST',
      body: JSON.stringify({ userId: userId }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      console.error('Failed to delete message:', await response.text());
    } 


    //chat will not allow you to remove anything the chat uses...(user, events, or channel...)
  } catch (error) {
    console.error('Cleanup error:', error);
  }

  //reset variables if success
  userId = -1;
  testEventTitle = "";
  testEventDesc = "";
  testEventId = -1;
});

test('Ensure basic delete message flow is working', async ({ page }) => {
  

  //click chat icon to open the chat
  await page.getByTestId(`${testEventTitle}_chat_btn`).click();
  
  //type and enter hello world
  await page.getByTestId('chat_text_field').fill(testMessageContent);
  await page.getByTestId("chat_send_btn").click();

  //expect hello world message to exist
  await expect(page.getByText(testMessageContent)).toBeVisible();

  //hover over the message to make the delete button appear
  await page.getByText(testMessageContent).hover();

  //expect delete button to exist
  await expect(page.getByTestId(`${testMessageContent}_delete_btn`)).toBeVisible();

  //click delete button
  await page.getByTestId(`${testMessageContent}_delete_btn`).click();

  //expect delete dialog to popup
  await expect(page.getByTestId('delete_message_dialog')).toBeVisible();

  //click continue to delete
  await page.getByText("Continue").click();

  //expect message to say this message has been deleted and ensure dialog closed
  await expect(page.getByText("This message has been deleted.")).toBeVisible();
  await expect(page.getByText("This message has been deleted.")).toBeVisible();
  await expect(page.getByText("This message has been deleted.")).toBeVisible();
  await expect(page.getByText("This message has been deleted.")).toBeVisible();


  // Exit chat
  await page.getByLabel('Chat').locator('button').filter({ hasText: 'Close' }).click();

  //wait til the chat is actually closed
  await expect(page.getByText("Finalized")).toBeVisible();
  await expect(page.getByText("Finalized")).toBeVisible();
  await expect(page.getByText("Finalized")).toBeVisible();


});


test('Ensure cancel delete message flow is working with cancel button', async ({ page }) => {
  //click chat icon to open the chat
  await page.getByTestId(`${testEventTitle}_chat_btn`).click();

  //type and enter hello world
  await page.getByTestId('chat_text_field').fill(testMessageContent);
  await page.getByTestId("chat_send_btn").click();
 
  //expect hello world message to exist
  await expect(page.getByText(testMessageContent)).toBeVisible();

  //hover over the message to make the delete button appear
  await page.getByText(testMessageContent).hover();

  //expect delete button to exist
  await expect(page.getByTestId(`${testMessageContent}_delete_btn`)).toBeVisible();

  //click delete button
  await page.getByTestId(`${testMessageContent}_delete_btn`).click();

  //expect delete dialog to popup
  await expect(page.getByTestId('delete_message_dialog')).toBeVisible();

  //click cancel to cancel the delete
  await page.getByText("Cancel").click();

  //expect message to not have been deleted
  await expect(page.getByText(testMessageContent)).toBeVisible();
  await expect(page.getByText(testMessageContent)).toBeVisible();
  await expect(page.getByText(testMessageContent)).toBeVisible();
  await expect(page.getByText(testMessageContent)).toBeVisible();

  // Exit chat
  await page.getByLabel('Chat').locator('button').filter({ hasText: 'Close' }).click();

  //wait til the chat is actually closed
  await expect(page.getByText("Finalized")).toBeVisible();
  await expect(page.getByText("Finalized")).toBeVisible();
  await expect(page.getByText("Finalized")).toBeVisible();

});

test('Ensure cancel delete message flow is working by clicking outside', async ({ page }) => {
  //click chat icon to open the chat
  await page.getByTestId(`${testEventTitle}_chat_btn`).click();

   //type and enter hello world
   await page.getByTestId('chat_text_field').fill(testMessageContent);
   await page.getByTestId("chat_send_btn").click();
 
   //expect hello world message to exist
   await expect(page.getByText(testMessageContent)).toBeVisible();

  //hover over the message to make the delete button appear
  await page.getByText(testMessageContent).hover();

  //expect delete button to exist
  await expect(page.getByTestId(`${testMessageContent}_delete_btn`)).toBeVisible();

  //click delete button
  await page.getByTestId(`${testMessageContent}_delete_btn`).click();

  //expect delete dialog to popup
  await expect(page.getByTestId('delete_message_dialog')).toBeVisible();

  // Click outside of the dialog box
  const dialog = page.getByTestId('delete_message_dialog');
  const box = (await dialog.boundingBox())!;
  await page.mouse.click(box.x - box.x/2, box.y + box.y/2);

  //expect message to not have been deleted
  await expect(page.getByText(testMessageContent)).toBeVisible();
  await expect(page.getByText(testMessageContent)).toBeVisible();
  await expect(page.getByText(testMessageContent)).toBeVisible();
  await expect(page.getByText(testMessageContent)).toBeVisible();

  // Exit chat
  await page.getByLabel('Chat').locator('button').filter({ hasText: 'Close' }).click();

  //wait til the chat is actually closed
  await expect(page.getByText("Finalized")).toBeVisible();
  await expect(page.getByText("Finalized")).toBeVisible();
  await expect(page.getByText("Finalized")).toBeVisible();

});

