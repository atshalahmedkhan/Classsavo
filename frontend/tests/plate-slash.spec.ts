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
    await expect(menu.getByText('Text')).toBeVisible();
    await expect(menu.getByText('Heading 1')).toBeVisible();
    await expect(menu.getByText('Bulleted list')).toBeVisible();
    await expect(menu.getByTestId('slash-item-AI')).toBeVisible();
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
    const headingItem = page.getByTestId('slash-item-h1');
    await expect(headingItem).toBeVisible();
    await headingItem.click();

    await expect(editor.locator('h1')).toBeVisible();
    await expect(page.getByTestId('slash-command-menu')).not.toBeVisible();
  });

  test('instructor can open AI assistant from slash menu and generate content', async ({
    page,
    request,
  }) => {
    const instructor = await registerUser(request, 'instructor', 'slashai');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash AI Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);
    await fillField(page, 'Title', 'Slash AI Chapter');

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/ai');
    const aiItem = page.getByTestId('slash-item-AI');
    await expect(aiItem).toBeVisible();
    await aiItem.click();

    const aiPanel = page.getByTestId('ai-assistant-panel');
    await expect(aiPanel).toBeVisible();
    await page.getByTestId('ai-assistant-input').fill('photosynthesis');
    await aiPanel.getByRole('button', { name: 'Generate' }).click();

    await expect(editor.getByText(/photosynthesis/i)).toBeVisible();
    await expect(aiPanel).not.toBeVisible();
  });

  test('instructor can open AI assistant with Ctrl+J', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'ctrlij');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Ctrl J Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.press('Control+J');

    await expect(page.getByTestId('ai-assistant-panel')).toBeVisible();
  });
});
