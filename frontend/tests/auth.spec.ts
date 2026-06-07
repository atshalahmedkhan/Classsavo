import { test, expect } from '@playwright/test';
import {
  fillField,
  loginViaUi,
  registerInstructorViaUi,
  registerStudentViaUi,
  registerUser,
  uniqueId,
} from './helpers';

test.describe('Auth Flow', () => {
  test('register student redirects to student dashboard', async ({ page }) => {
    const username = uniqueId('regstudent');
    await registerStudentViaUi(page, username, `${username}@example.com`);
    await expect(page.getByRole('heading', { name: 'Progress & Achievements' })).toBeVisible();
  });

  test('register instructor redirects to instructor dashboard', async ({ page }) => {
    const username = uniqueId('reginstr');
    await registerInstructorViaUi(page, username, `${username}@example.com`);
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('login as student redirects to student dashboard', async ({ page, request }) => {
    const auth = await registerUser(request, 'student', 'loginstu');
    await loginViaUi(page, auth.user.username, auth.password, '/student');
    await expect(page.getByRole('heading', { name: 'Progress & Achievements' })).toBeVisible();
  });

  test('login as instructor redirects to instructor dashboard', async ({ page, request }) => {
    const auth = await registerUser(request, 'instructor', 'loginins');
    await loginViaUi(page, auth.user.username, auth.password, '/instructor');
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('login with wrong password shows error message', async ({ page, request }) => {
    const auth = await registerUser(request, 'student', 'badlogin');
    await page.goto('/login');
    await fillField(page, 'Username', auth.user.username);
    await fillField(page, 'Password', 'wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/credentials/i)).toBeVisible();
  });

  test('unauthenticated user visiting student my-courses redirects to login', async ({ page }) => {
    await page.goto('/student/my-courses');
    await page.waitForURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('unauthenticated user visiting instructor redirects to login', async ({ page }) => {
    await page.goto('/instructor');
    await page.waitForURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
