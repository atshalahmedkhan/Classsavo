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

test.describe('Plate.js Toolbar', () => {
  test('instructor can change font family from toolbar', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'toolbarfont');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Toolbar Font Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);
    await fillField(page, 'Title', 'Toolbar Font Chapter');

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('Font toolbar test');

    const fontSelect = page.getByTestId('plate-font-family');
    await fontSelect.selectOption('Georgia');
    await expect(fontSelect).toHaveValue('Georgia');

    await editor.click();
    await expect(fontSelect).toHaveValue('Georgia');
  });

  test('instructor can center-align text from toolbar', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'toolbaralign');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Toolbar Align Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('Center align test');

    const centerButton = page.getByTestId('plate-align-center');
    await centerButton.dispatchEvent('mousedown');

    await expect(centerButton).toHaveAttribute('aria-pressed', 'true');
    await expect(async () => {
      const textAlign = await editor.evaluate((root) => {
        const block = root.querySelector('[data-slate-node="element"]');
        if (!block) return '';
        return window.getComputedStyle(block).textAlign;
      });
      expect(textAlign).toBe('center');
    }).toPass();
  });
});
