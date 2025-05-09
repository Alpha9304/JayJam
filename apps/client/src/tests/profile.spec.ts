import { test, expect } from "@playwright/test";
import { TEST_CONFIG } from "./config";

const TESTER_EMAIL = "flastname2@jhu.edu";
let TESTER_NAME = "Test Name";
const userPassword = "CTester-Password1!";

// create sample user
test.beforeAll(async () => {
	// add sample user
	const response = await fetch(`${TEST_CONFIG.backendUrl}/create-user-verified`, {
		method: 'POST',
		body: JSON.stringify({ name: TESTER_NAME, email: TESTER_EMAIL, password: userPassword }),
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) {
		throw new Error('Failed to create sample user');
	}
})

// navigate to profile page
test.beforeEach(async ({page}) => {
	// home page
	await page.goto(`${TEST_CONFIG.frontendUrl}/`);

	// log in
	await page.getByTestId('login_email_input').fill(TESTER_EMAIL);
	await page.getByTestId('login_password_input').fill(userPassword);
	await page.getByTestId('login_btn').click();

	// go to profile page
	await page.getByTestId("profile_btn").click();
	await expect(page).toHaveURL("http://localhost:3002/profile")
})

// clean up
test.afterAll(async () => {
	// delete sample user
	const response = await fetch(`${TEST_CONFIG.backendUrl}/delete-user`, {
		method: 'POST',
		body: JSON.stringify({ email: TESTER_EMAIL }),
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) {
		throw new Error('Failed to delete sample user');
	}
});

test("Ensure user can change name with valid input", async ({page}) => {
	// click pencil icon to edit name
	await page.getByTestId("edit_name_btn").click();

	// wait for input field to be editable
	const nameInput = page.getByTestId("edit_name_input")
	await expect(nameInput).not.toHaveAttribute('readonly', 'true');

	// add new name
	await nameInput.fill("Apple Smith")
	await nameInput.press("Enter")

	// check name has been changed
	await expect(page.getByTestId('edit_name_input')).toHaveValue('Apple Smith');
	TESTER_NAME = "Apple Smith"
})

test("Ensure user cannot change name with invalid input", async ({page}) => {
	// click pencil icon to edit name
	await page.getByTestId("edit_name_btn").click();

	// wait for input field to be editable
	const nameInput = page.getByTestId("edit_name_input")
	await expect(nameInput).not.toHaveAttribute('readonly', 'true');

	// add new name
	await nameInput.fill("Apple Smith Green")
	await nameInput.press("Enter")

	// check name has not been changed
	await expect(page.getByTestId('edit_name_input')).toHaveValue('Apple Smith');
})

test("Ensure user can change major with valid input", async ({page}) => {
	// click pencil icon to edit major
	await page.getByTestId("edit_major_btn").click();

	// wait for input field to be editable
	const majorInput = page.getByTestId("edit_major_input")
	await expect(majorInput).not.toHaveAttribute('readonly', 'true');

	// add new major
	await majorInput.fill("Computer Science")
	await majorInput.press("Enter")

	// check major has been changed
	await expect(page.getByTestId('edit_major_input')).toHaveValue('Computer Science');
})

test("Ensure user can change pronouns with valid input", async ({page}) => {
	// click pencil icon to edit pronouns
	await page.getByTestId("edit_pronouns_btn").click();

	// wait for input field to be editable
	const pronounsInput = page.getByTestId("edit_pronouns_input")
	await expect(pronounsInput).not.toHaveAttribute('readonly', 'true');

	// add new pronouns
	await pronounsInput.fill("she/her")
	await pronounsInput.press("Enter")

	// check prononuns has been changed
	await expect(page.getByTestId('edit_pronouns_input')).toHaveValue('she/her');
})

// test("Ensure user can change profile picture with valid jpg file", async ({page}) => {
// 	// click pencil icon to edit profile picture
// 	await page.getByTestId("edit_profpic_btn").click();

// 	// set the file on the input directly
//   	const filePath = path.resolve(__dirname, 'test_data/after.jpg'); // find cat pic in server test_data
//   	await page.getByTestId('profpic_input').setInputFiles(filePath);

// 	// check profile picture changed to after.jpg
// 	const profileInput = page.getByTestId("profpic_input")
// 	await expect(profileInput).toHaveAttribute('src', /blob:|data:image/);
// 	const profilePic = page.getByTestId("profpic")
// 	const imageSrc = await profilePic.getAttribute('src');
// 	expect(imageSrc).toContain('after.jpg');
// })