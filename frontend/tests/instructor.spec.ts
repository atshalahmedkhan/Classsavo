import path from 'node:path';
import { test, expect } from '@playwright/test';
import { API_BASE, fillField, loginViaUi, openChapterEditor, registerUser, seedChapter, seedInstructorCourse } from './helpers';

test.describe('Instructor Flow', () => {
  test('instructor can see their courses on My Courses page', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'inslist');
    await seedInstructorCourse(request, instructor.access, 'Instructor Visible Course');
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto('/instructor/courses');
    await expect(page.getByText('Instructor Visible Course')).toBeVisible();
  });

  test('instructor can create a new course via wizard and it appears in list', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'wizard');
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto('/instructor/courses/new');
    await fillField(page, 'Course Title', 'Wizard Created Course');
    await fillField(page, 'Course Description', 'Created through the four-step wizard flow.');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Create & Open Curriculum' }).click();
    await page.waitForURL(/\/instructor\/courses\/\d+/);
    await page.goto('/instructor/courses');
    await expect(page.getByText('Wizard Created Course')).toBeVisible();
  });

  test('instructor can open a course and add a new chapter', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'addch');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Chapter Parent Course');
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await page.getByRole('button', { name: 'Add New Chapter' }).click();
    await fillField(page, 'Title', 'New Playwright Chapter');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('New Playwright Chapter')).toBeVisible();
  });

  test('instructor can type in Plate.js editor and save content', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'plateins');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Plate Course');
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await page.getByRole('button', { name: 'Add New Chapter' }).click();
    await fillField(page, 'Title', 'Plate Chapter');
    await page.locator('[contenteditable="true"]').first().click();
    await page.keyboard.type('Instructor typed chapter content');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Plate Chapter')).toBeVisible();
  });

  test('instructor can toggle chapter from private to public', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'toggle');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Toggle Course');
    await seedChapter(request, instructor.access, courseId, { title: 'Toggle Chapter', isPublic: false });
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await page.getByRole('button', { name: 'Draft' }).click();
    await expect(page.getByRole('button', { name: 'Published' })).toBeVisible();
  });

  test('instructor can upload a PDF and delete it from chapter', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'fileins');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Upload Course');
    await seedChapter(request, instructor.access, courseId, { title: 'Upload Chapter', isPublic: true });
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);

    await openChapterEditor(page, 'Upload Chapter');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'sample.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Playwright test file'),
    });
    await expect(page.getByText('sample.pdf')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete sample.pdf' }).click();
    await expect(page.getByText('sample.pdf')).not.toBeVisible();
  });

  test('instructor can see access code for their course', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'codeins');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Access Code Course');
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await expect(page.getByText('Access code:')).toBeVisible();
    await expect(page.locator('span.font-mono.font-bold.tracking-widest').first()).toBeVisible();
  });

  test('instructor can see enrolled students list on course page', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'studentsins');
    const student = await registerUser(request, 'student', 'studentsstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Students Course');
    await request.post(`${API_BASE}/courses/${courseId}/join/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: { access_code: accessCode },
    });
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await expect(page.getByRole('heading', { name: /Enrolled Students/ })).toBeVisible();
    await expect(page.getByText(student.user.username).first()).toBeVisible();
  });

  test('instructor can see student progress tab with status cells', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'progins');
    const student = await registerUser(request, 'student', 'progstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Progress Tab Course');
    await seedChapter(request, instructor.access, courseId, { title: 'Tracked Chapter', isPublic: true });
    await request.post(`${API_BASE}/courses/${courseId}/join/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: { access_code: accessCode },
    });
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await page.getByRole('button', { name: 'Student Progress' }).click();
    await expect(page.getByText('✓ = read · time = in progress · — = not started')).toBeVisible();
  });

  test('instructor can reply to student message', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'replyins');
    const student = await registerUser(request, 'student', 'replystu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Reply Course');
    await request.post(`${API_BASE}/courses/${courseId}/join/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: { access_code: accessCode },
    });
    await request.post(`${API_BASE}/messages/${instructor.user.id}/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: { body: 'Student question', course_id: courseId },
    });

    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/messages?user=${student.user.id}`);
    await page.getByPlaceholder('Type a message...').fill('Instructor reply from Playwright');
    await page.getByPlaceholder('Type a message...').press('Enter');
    await expect(page.getByText('Instructor reply from Playwright')).toBeVisible();
  });
});
