import type { APIRequestContext, Locator, Page } from '@playwright/test';

export const API_BASE = 'http://127.0.0.1:8000/api';

let counter = 0;

export function uniqueId(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now()}${counter}`;
}

/** Labels in the app are not wired with htmlFor, so getByLabel does not work. */
export function fieldByLabel(page: Page, label: string): Locator {
  return page
    .locator('label')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .locator('..')
    .locator('input, select, textarea')
    .first();
}

export async function fillField(page: Page, label: string, value: string): Promise<void> {
  await fieldByLabel(page, label).fill(value);
}

export async function selectField(page: Page, label: string, value: string): Promise<void> {
  await fieldByLabel(page, label).selectOption(value);
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: { id: number; username: string; role: string };
}

export async function registerUser(
  request: APIRequestContext,
  role: 'student' | 'instructor',
  prefix: string,
): Promise<AuthTokens & { password: string; email: string }> {
  const username = uniqueId(prefix);
  const email = `${username}@example.com`;
  const password = 'pass12345';
  const response = await request.post(`${API_BASE}/auth/register/`, {
    data: {
      username,
      email,
      password,
      password_confirm: password,
      role,
      first_name: role === 'instructor' ? 'Test' : 'Student',
      last_name: 'User',
    },
  });
  if (!response.ok()) {
    throw new Error(`Register failed: ${await response.text()}`);
  }
  const body = await response.json();
  return {
    access: body.tokens.access,
    refresh: body.tokens.refresh,
    user: body.user,
    password,
    email,
  };
}

export async function loginViaUi(
  page: Page,
  username: string,
  password: string,
  expectedPath: string,
): Promise<void> {
  await page.goto('/login');
  await fillField(page, 'Username', username);
  await fillField(page, 'Password', password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(expectedPath);
}

export async function registerStudentViaUi(
  page: Page,
  username: string,
  email: string,
): Promise<void> {
  await page.goto('/register');
  await fillField(page, 'First name', 'Test');
  await fillField(page, 'Last name', 'Student');
  await fillField(page, 'Username', username);
  await fillField(page, 'Email', email);
  await selectField(page, 'Role', 'student');
  await fillField(page, 'Password', 'pass12345');
  await fillField(page, 'Confirm password', 'pass12345');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.waitForURL('/student');
}

export async function registerInstructorViaUi(page: Page, username: string, email: string): Promise<void> {
  await page.goto('/register');
  await fillField(page, 'Username', username);
  await fillField(page, 'Email', email);
  await selectField(page, 'Role', 'instructor');
  await fillField(page, 'Password', 'pass12345');
  await fillField(page, 'Confirm password', 'pass12345');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.waitForURL('/instructor');
}

export async function seedInstructorCourse(
  request: APIRequestContext,
  accessToken: string,
  title = 'Playwright Test Course',
): Promise<{ courseId: number; accessCode: string }> {
  const response = await request.post(`${API_BASE}/courses/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { title, description: 'Course created for automated tests' },
  });
  if (!response.ok()) {
    throw new Error(`Create course failed: ${await response.text()}`);
  }
  const body = await response.json();
  return { courseId: body.id, accessCode: body.access_code };
}

export async function seedChapter(
  request: APIRequestContext,
  accessToken: string,
  courseId: number,
  options: { title: string; isPublic: boolean; content?: unknown[] },
): Promise<number> {
  const response = await request.post(`${API_BASE}/chapters/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      title: options.title,
      content: options.content ?? [{ type: 'p', children: [{ text: 'Test chapter content for Playwright.' }] }],
      course: courseId,
      is_public: options.isPublic,
      order: 1,
    },
  });
  if (!response.ok()) {
    throw new Error(`Create chapter failed: ${await response.text()}`);
  }
  const body = await response.json();
  return body.id as number;
}

export async function openChapterEditor(page: Page, chapterTitle: string): Promise<void> {
  const chapterCard = page
    .locator('.rounded-xl')
    .filter({ has: page.getByRole('heading', { name: chapterTitle, exact: true }) })
    .first();
  // Buttons: visibility toggle, move up, move down, edit, delete
  await chapterCard.getByRole('button').nth(3).click();
}

export function joinCourseModal(page: Page) {
  return page.locator('[class*="fixed"][class*="inset-0"]').filter({
    has: page.getByRole('heading', { name: /^Join / }),
  });
}

export async function openJoinCourseModal(page: Page, courseTitle?: string): Promise<void> {
  if (courseTitle) {
    await page
      .locator('.rounded-xl')
      .filter({ has: page.getByRole('heading', { name: courseTitle, exact: true }) })
      .getByRole('button', { name: 'Enroll in Course' })
      .click();
    return;
  }
  await page.getByRole('button', { name: 'Enroll in Course' }).first().click();
}

export function joinModalEnrollButton(page: Page) {
  return joinCourseModal(page).getByRole('button', { name: 'Enroll', exact: true });
}

export async function enrollStudent(
  request: APIRequestContext,
  accessToken: string,
  courseId: number,
  accessCode: string,
): Promise<void> {
  const response = await request.post(`${API_BASE}/courses/${courseId}/join/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { access_code: accessCode },
  });
  if (!response.ok()) {
    throw new Error(`Enroll failed: ${await response.text()}`);
  }
}
