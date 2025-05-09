import { test, expect } from "@playwright/test";
import { TEST_CONFIG } from "../config";

test("create event", async ({ page }) => {
  // Recording...
  await page.goto(TEST_CONFIG.frontendUrl);
  await page.getByTestId("login_email_input").click();
  await page.getByTestId("login_email_input").fill(TEST_CONFIG.testEmail);
  await page.getByTestId("login_email_input").press("Tab");
  await page.getByTestId("login_password_input").fill(TEST_CONFIG.testPassword);
  await page.getByTestId("login_btn").click();
  await page.getByRole("button", { name: "My Classes" }).click();
  await page.getByText("View Details").first().click();
  await page.getByRole("tab", { name: "Pending Events" }).click();
  await page.getByRole("button", { name: "Create Event" }).click();
  await page.getByRole("textbox", { name: "Title" }).fill("testt");
  await page.getByRole("textbox", { name: "Description" }).click();
  await page.getByRole("textbox", { name: "Description" }).fill("testDesc");
  await page.getByTestId('possible-start-time-picker').click();
  await page.getByRole("button", { name: "Go to next month" }).click();
  await page.getByRole("gridcell", { name: "18" }).click();
  await page.getByTestId('possible-start-time-picker').click();
  await page.waitForTimeout(1000);
  await page.getByTestId('possible-end-time-picker').click();
  await page.getByRole("button", { name: "Go to next month" }).click();
  await page.getByRole("gridcell", { name: "24" }).click();
  await page.getByTestId('possible-end-time-picker').click();
  await page.waitForTimeout(1000);
  await page.getByTestId('registration-deadline-picker').click();
  await page.getByRole("button", { name: "Go to next month" }).click();
  await page.getByRole("gridcell", { name: "15" }).click();
  await page.getByTestId('registration-deadline-picker').click();
  await page.waitForTimeout(1000);
  await page.getByRole("spinbutton", { name: "Population Limit" }).click();
  await page.getByRole("spinbutton", { name: "Population Limit" }).fill("10");
  await page.getByRole("button", { name: "Create Event" }).click();
  await expect(page.getByRole('listitem')).toContainText('Event created successfully');
});
