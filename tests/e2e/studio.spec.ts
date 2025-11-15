import { test, expect } from "@playwright/test";

test("full user journey", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  // signup
  await page.click("text=Signup");
  await page.fill("input[name=email]", "new@user.com");
  await page.fill("input[name=password]", "password123");
  await page.click("text=Create Account");

  // login
  await page.fill("input[name=email]", "new@user.com");
  await page.fill("input[name=password]", "password123");
  await page.click("text=Login");

  // upload + generate
  await page.setInputFiles("input[type=file]", "tests/files/sample.png");
  await page.fill('input[placeholder="Enter prompt"]', "cat");
  await page.click("text=Generate");

  await expect(page.getByText("History")).toBeVisible();

  // restore view
  await page.click("text=Restore");
});
