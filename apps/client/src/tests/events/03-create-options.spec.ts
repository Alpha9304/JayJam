import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test('create and update event options', async ({ page }) => {
  // Login
  await page.goto(TEST_CONFIG.frontendUrl);
  await page.getByTestId('login_email_input').click();
  await page.getByTestId('login_email_input').fill(TEST_CONFIG.testEmail);
  await page.getByTestId('login_password_input').fill(TEST_CONFIG.testPassword);
  await page.getByTestId('login_btn').click();

  // Navigate to class and create event
  await page.getByRole('button', { name: 'My Classes' }).click();
  await page.getByText('View Details').first().click();
  await page.getByRole('tab', { name: 'Pending Events' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();

  // Fill in event details
  await page.getByRole('textbox', { name: 'Title' }).fill('testt');
  await page.getByRole('textbox', { name: 'Description' }).fill('testDesc');
  
  // Set possible start time
  await page.getByTestId('possible-start-time-picker').click();
  await page.getByRole('button', { name: 'Go to next month' }).click();
  await page.getByRole('gridcell', { name: '18' }).click();
  await page.getByTestId('possible-start-time-picker').click();
  await page.waitForTimeout(1000);
  
  // Set possible end time
  await page.getByTestId('possible-end-time-picker').click();
  await page.getByRole('button', { name: 'Go to next month' }).click();
  await page.getByRole('gridcell', { name: '24' }).click();
  await page.getByTestId('possible-end-time-picker').click();
  await page.waitForTimeout(1000);
  
  // Set registration deadline
  await page.getByTestId('registration-deadline-picker').click();
  await page.getByRole('button', { name: 'Go to next month' }).click();
  await page.getByRole('gridcell', { name: '15' }).click();
  await page.getByTestId('registration-deadline-picker').click();
  await page.waitForTimeout(1000);
  
  // Set population limit
  await page.getByRole('spinbutton', { name: 'Population Limit' }).click();
  await page.getByRole('spinbutton', { name: 'Population Limit' }).fill('10');
  
  // Create event
  await page.getByRole('button', { name: 'Create Event' }).click();
  await expect(page.getByRole('listitem')).toContainText('Event created successfully');
  
  // Wait for event to be created and click update button
  await page.getByRole('tabpanel', { name: 'Pending Events' }).getByRole('button').nth(3).click();
  
  // Verify update form is open
  await expect(page.getByTestId('update-event-title')).toBeVisible();
  
  // Add location option
  await page.getByRole('button', { name: 'Add Location' }).click();
  await page.getByRole('textbox', { name: 'Enter location' }).fill('test location1');
  await page.getByRole('button', { name: 'Add Location' }).click();
  
  // Add time slot option
  await page.getByRole('button', { name: 'Add Time Slot' }).click();
  await page.getByRole('button', { name: 'Pick a date' }).click();
  await page.getByRole('button', { name: 'Go to next month' }).click();
  await page.getByRole('gridcell', { name: '21' }).click();
  
  // Set time slot hours and minutes
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: '10' }).click();
  await page.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: '40' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Hr' }).click();
  await page.getByRole('option', { name: '11' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Min' }).click();
  await page.getByRole('option', { name: '30' }).click();
  
  // Add the time slot
  await page.getByRole('button', { name: 'Add Slot' }).click();
  
  // Update options
  await page.getByTestId('update-options-btn').click();
  
  // Verify success message
  await expect(page.getByRole('list')).toContainText('Event options updated successfully');

  // Reopen the update form
  await page.getByRole('tabpanel', { name: 'Pending Events' }).getByRole('button').nth(3).click();
  
  // Verify location and time options are present
  const locationOptions = await page.getByTestId(/location-option-\d+/).all();
  const timeOptions = await page.getByTestId(/time-option-\d+/).all();
  
  expect(locationOptions.length).toBeGreaterThan(0);
  expect(timeOptions.length).toBeGreaterThan(0);

  // Get the IDs from the first options
  const locationId = await locationOptions[0].getAttribute('data-testid');
  const timeId = await timeOptions[0].getAttribute('data-testid');
  
  if (!locationId || !timeId) {
    throw new Error('Failed to get option IDs');
  }

  // Select a location option
  await page.getByTestId(`location-option-${locationId.split('-')[2]}`).click();
  
  // Select a time option
  await page.getByTestId(`time-option-${timeId.split('-')[2]}`).click();
  
  // Finalize the event
  await page.getByTestId('finalize-event-btn').click();
  
  // Verify finalization success
  await expect(page.getByRole('list')).toContainText('Event finalized successfully');
});