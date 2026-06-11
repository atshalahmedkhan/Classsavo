import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

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

export async function switchUserViaUi(
  page: Page,
  username: string,
  password: string,
  expectedPath: string,
): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await loginViaUi(page, username, password, expectedPath);
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
  options: {
    title: string;
    isPublic: boolean;
    content?: unknown[];
    chapter_type?: 'syllabus' | 'reading' | 'assignment';
    order?: number;
  },
): Promise<number> {
  const response = await request.post(`${API_BASE}/chapters/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      title: options.title,
      content: options.content ?? [{ type: 'p', children: [{ text: 'Test chapter content for Playwright.' }] }],
      course: courseId,
      is_public: options.isPublic,
      chapter_type: options.chapter_type ?? 'reading',
      order: options.order ?? 1,
    },
  });
  if (!response.ok()) {
    throw new Error(`Create chapter failed: ${await response.text()}`);
  }
  const body = await response.json();
  return body.id as number;
}

export async function seedSyllabusChapter(
  request: APIRequestContext,
  accessToken: string,
  courseId: number,
): Promise<number> {
  return seedChapter(request, accessToken, courseId, {
    title: 'Course Syllabus',
    isPublic: true,
    chapter_type: 'syllabus',
    content: [{ type: 'p', children: [{ text: 'Published syllabus for Playwright tests.' }] }],
  });
}

export async function openNewReadingChapterForm(page: Page): Promise<void> {
  await page.getByRole('main').getByRole('button', { name: 'Add New Reading' }).click();
}

export async function openChapterEditor(page: Page, chapterTitle: string): Promise<void> {
  const chapterCard = page
    .locator('[id^="chapter-"]')
    .filter({ has: page.getByRole('heading', { name: chapterTitle, exact: true }) })
    .first();
  await chapterCard.getByRole('button', { name: `Edit ${chapterTitle}` }).click();
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

export function plateEditor(page: Page): Locator {
  return page.locator('form [contenteditable="true"]').first();
}

export function plateBoldButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Bold', exact: true });
}

export function chapterFormSubmitButton(page: Page, label: string): Locator {
  return page.locator('form').getByRole('button', { name: label });
}

export async function selectAllInPlateEditor(page: Page): Promise<void> {
  const editor = plateEditor(page);
  await editor.click();
  await editor.press('Control+A');
  const hasSelection = await editor.evaluate((root) => {
    const selection = window.getSelection();
    return Boolean(selection && !selection.isCollapsed && root.contains(selection.anchorNode));
  });
  if (!hasSelection) {
    await editor.click({ clickCount: 3 });
  }
}

async function pressBoldToolbarButton(page: Page): Promise<void> {
  await plateBoldButton(page).dispatchEvent('mousedown');
}

export async function applyBoldInPlateEditor(page: Page): Promise<void> {
  const editor = plateEditor(page);
  await expect(async () => {
    await selectAllInPlateEditor(page);
    await pressBoldToolbarButton(page);
    await expect(plateBoldButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(editor.locator('strong.font-bold').first()).toBeVisible();
  }).toPass();
}

export async function removeBoldInPlateEditor(page: Page, phrase?: string): Promise<void> {
  const editor = plateEditor(page);
  const boldLocator = phrase
    ? editor.locator('strong.font-bold', { hasText: phrase })
    : editor.locator('strong.font-bold');

  if (phrase) {
    await expect(boldLocator).toBeVisible();
  }

  await expect(async () => {
    await selectAllInPlateEditor(page);
    await pressBoldToolbarButton(page);
    await expect(plateBoldButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(boldLocator).toHaveCount(0);
  }).toPass();
}

export async function applyBoldViaShortcut(page: Page): Promise<void> {
  const editor = plateEditor(page);
  await expect(async () => {
    await selectAllInPlateEditor(page);
    await editor.press('Control+B');
    if ((await editor.locator('strong.font-bold').count()) === 0) {
      await selectAllInPlateEditor(page);
      await pressBoldToolbarButton(page);
    }
    await expect(plateBoldButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(editor.locator('strong.font-bold').first()).toBeVisible();
  }).toPass();
}

export async function removeBoldViaShortcut(page: Page, phrase?: string): Promise<void> {
  const editor = plateEditor(page);
  const boldLocator = phrase
    ? editor.locator('strong.font-bold', { hasText: phrase })
    : editor.locator('strong.font-bold');

  await selectAllInPlateEditor(page);
  await editor.press('Control+B');
  if ((await boldLocator.count()) > 0) {
    await selectAllInPlateEditor(page);
    await pressBoldToolbarButton(page);
  }
  await expect(plateBoldButton(page)).toHaveAttribute('aria-pressed', 'false');
  if (phrase) {
    await expect(boldLocator).toHaveCount(0);
  }
}

export function contentJsonHasBoldMark(content: unknown[]): boolean {
  return JSON.stringify(content).includes('"bold":true');
}

export function contentJsonLacksBoldMark(content: unknown[]): boolean {
  return !contentJsonHasBoldMark(content);
}

export function boldTextInEditor(page: Page, text: string): Locator {
  return plateEditor(page).locator('strong.font-bold', { hasText: text });
}

export async function expectEditorTextIsBold(page: Page, text: string): Promise<void> {
  const editor = plateEditor(page);
  await expect(editor.getByText(text)).toBeVisible();
  await expect(async () => {
    const isBold = await editor.evaluate((root, targetText) => {
      const leaves = root.querySelectorAll('[data-slate-leaf="true"]');
      for (const leaf of leaves) {
        if (!leaf.textContent?.includes(targetText as string)) continue;
        if (leaf.querySelector('strong, .font-bold, .slate-bold')) return true;
        const fontWeight = window.getComputedStyle(leaf).fontWeight;
        return fontWeight === '700' || fontWeight === 'bold';
      }
      return false;
    }, text);
    expect(isBold).toBe(true);
  }).toPass();
}

export async function expectEditorTextIsNotBold(page: Page, text: string): Promise<void> {
  await expect(boldTextInEditor(page, text)).toHaveCount(0);
  await expect(plateEditor(page).getByText(text)).toBeVisible();
}

export async function fetchChapter(
  request: APIRequestContext,
  accessToken: string,
  chapterId: number,
): Promise<{ content: unknown[] }> {
  const response = await request.get(`${API_BASE}/chapters/${chapterId}/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok()) {
    throw new Error(`Fetch chapter failed: ${await response.text()}`);
  }
  return response.json();
}

type PlateTextNode = { text?: string; bold?: boolean; children?: PlateTextNode[] };

export function textNodeHasBoldMark(content: unknown[], text: string): boolean {
  return contentIncludesBoldText(content, text);
}

function contentIncludesBoldText(content: unknown[], text: string): boolean {
  const walk = (nodes: unknown[]): boolean => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const entry = node as PlateTextNode;
      if (entry.text?.includes(text) && entry.bold === true) return true;
      if (entry.children && walk(entry.children)) return true;
    }
    return false;
  };
  return walk(content);
}

export function textNodeLacksBoldMark(content: unknown[], text: string): boolean {
  let found = false;
  const walk = (nodes: unknown[]): boolean => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const entry = node as PlateTextNode;
      if (entry.text?.includes(text)) {
        found = true;
        if (entry.bold === true) return false;
      }
      if (entry.children && !walk(entry.children)) return false;
    }
    return true;
  };
  return found && walk(content);
}
