import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

test("login, verify a lab flag, and reload the saved progress report", async ({
  page,
  request,
}) => {
  const email = randomUUID() + "@example.test";
  const password = randomUUID();
  const registered = await request.post("/api/auth/register", {
    data: { name: "Test Student", email, password },
  });
  expect(registered.ok()).toBe(true);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/labs/api-excessive-data-exposure");
  // Read the bundled answer fixture server-side without exercising a vulnerable service.
  const flag = readFileSync(
    "labs/api-excessive-data-exposure/app.py",
    "utf8",
  ).match(/^FLAG = "([^"]+)"/m)?.[1];
  if (!flag) throw new Error("Missing local test fixture");
  await page.getByLabel("Captured flag").fill(flag);
  await page.getByRole("button", { name: "Submit Flag", exact: true }).click();
  await expect(
    page.getByText("Flag accepted. Lab marked as solved."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unlock follow-up case" }).click();
  await page.getByRole("button", { name: "Run regression check" }).click();
  await expect(
    page.getByText(/Check failed. Keep the display name/),
  ).toBeVisible();
  await page.getByLabel("Response fields").fill('["displayName"]');
  await page.getByRole("button", { name: "Run regression check" }).click();
  await expect(page.getByText(/Both checks passed/)).toBeVisible();
  await page.goto("/progress");
  await page.reload();
  await expect(page.getByText("1/6 labs solved")).toBeVisible();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
});

test("a guest reviews a sample case without a lab runtime", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo/index.html#fields");
  await page.getByRole("button", { name: /field=role/ }).click();
  await page
    .getByRole("button", { name: /Accept only editable fields/ })
    .click();
  await expect(page.getByText("1 of 6 case reviews complete")).toBeVisible();
  expect(
    requests.every((url) => new URL(url).pathname.startsWith("/demo/")),
  ).toBe(true);
});

test("instructors publish a linked lesson and students can read it", async ({
  browser,
  baseURL,
}) => {
  const instructor = await browser.newContext({ baseURL });
  const student = await browser.newContext({ baseURL });
  try {
    for (const [ctx, role] of [
      [instructor, "instructor"],
      [student, "student"],
    ] as const) {
      const response = await ctx.request.post("/api/auth/register", {
        data: {
          name: "Course reviewer",
          email: randomUUID() + "@example.test",
          password: randomUUID(),
          role,
          instructorCode: "e2e-only",
        },
      });
      expect(response.status()).toBe(200);
    }
    const title = "Response contract " + randomUUID().slice(0, 8);
    const editor = await instructor.newPage();
    await editor.goto("/courses");
    await editor.getByText("Add a lesson", { exact: true }).click();
    await editor.getByLabel("Title", { exact: true }).fill(title);
    await editor
      .getByLabel("Lesson text")
      .fill("Identify the public fields in a student response.");
    await editor
      .getByLabel("Linked lab")
      .selectOption("api-excessive-data-exposure");
    await editor.getByRole("button", { name: "Publish lesson" }).click();
    await expect(editor.getByRole("heading", { name: title })).toBeVisible();
    const reader = await student.newPage();
    await reader.goto("/courses");
    await expect(reader.getByRole("heading", { name: title })).toBeVisible();
    await expect(reader.getByText("Edit lesson", { exact: true })).toHaveCount(
      0,
    );
    expect((await student.request.get("/api/certificate")).status()).toBe(403);
  } finally {
    await instructor.close();
    await student.close();
  }
});
