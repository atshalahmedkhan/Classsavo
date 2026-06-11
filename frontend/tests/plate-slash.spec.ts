import { test, expect } from '@playwright/test';
import {
  fillField,
  loginViaUi,
  openNewReadingChapterForm,
  plateEditor,
  registerUser,
  seedInstructorCourse,
  seedSyllabusChapter,
} from './helpers';

test.describe('Plate.js Slash Command', () => {
  test('instructor sees slash command menu when typing /', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'slashmenu');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash Menu Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);
    await fillField(page, 'Title', 'Slash Menu Chapter');

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/');

    const menu = page.getByTestId('slash-command-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Basic blocks')).toBeVisible();
    await expect(menu.getByRole('option', { name: 'Text' })).toBeVisible();
    await expect(menu.getByRole('option', { name: 'Heading 1' })).toBeVisible();
    await expect(menu.getByRole('option', { name: 'Bulleted list' })).toBeVisible();
  });

  test('instructor can filter slash menu and insert a heading', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'slashh1');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash H1 Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);
    await fillField(page, 'Title', 'Slash H1 Chapter');

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/head');
    await page.getByTestId('slash-command-menu').getByRole('option', { name: 'Heading 1' }).click();

    await expect(editor.locator('h1')).toBeVisible();
    await expect(page.getByTestId('slash-command-menu')).not.toBeVisible();
  });
});
