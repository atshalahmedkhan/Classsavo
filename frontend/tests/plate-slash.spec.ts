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

  test('instructor can navigate slash menu with arrow keys and insert with Enter', async ({
    page,
    request,
  }) => {
    const instructor = await registerUser(request, 'instructor', 'slashkeys');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash Keys Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);
    await fillField(page, 'Title', 'Slash Keys Chapter');

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/');

    const menu = page.getByTestId('slash-command-menu');
    await expect(menu).toBeVisible();
    await expect(page.getByTestId('slash-item-AI')).toHaveAttribute('data-active-item', 'true');

    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('slash-item-p')).toHaveAttribute('data-active-item', 'true');

    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('slash-item-h1')).toHaveAttribute('data-active-item', 'true');

    await page.keyboard.press('Enter');
    await expect(editor.locator('h1')).toBeVisible();
    await expect(menu).not.toBeVisible();
  });

  test('instructor can insert a code block from slash menu', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'slashcode');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash Code Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/code');
    await page.getByTestId('slash-item-code_block').click();

    await expect(editor.getByTestId('code-block-language')).toHaveText('Plain Text');
    await expect(page.getByTestId('slash-command-menu')).not.toBeVisible();
  });

  test('instructor can insert a to-do list from slash menu', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'slashtodo');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash Todo Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/todo');
    await page.getByTestId('slash-item-todo').click();

    await expect(editor.getByTestId('todo-checkbox')).toBeVisible();
    await expect(page.getByTestId('slash-command-menu')).not.toBeVisible();
  });

  test('instructor can insert a date from slash menu and open calendar', async ({
    page,
    request,
  }) => {
    const instructor = await registerUser(request, 'instructor', 'slashdate');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash Date Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/date');
    await page.getByTestId('slash-item-date').click();

    const datePill = editor.getByTestId('date-pill');
    await expect(datePill).toBeVisible();
    await datePill.click();
    await expect(editor.getByTestId('date-calendar')).toBeVisible();
  });

  test('instructor can insert a blockquote from slash menu', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'slashquote');
    const { courseId } = await seedInstructorCourse(
      request,
      instructor.access,
      'Slash Quote Course',
    );
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/quote');
    await page.getByTestId('slash-item-blockquote').click();

    await expect(editor.locator('blockquote')).toBeVisible();
    await expect(page.getByTestId('slash-command-menu')).not.toBeVisible();
  });

  test('instructor can insert table of contents from slash menu', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'slashtoc');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash TOC Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/toc');
    await page.getByTestId('slash-item-toc').click();

    await expect(editor.getByTestId('toc-block')).toBeVisible();
    await expect(editor.getByText('Create a heading to display the table of contents.')).toBeVisible();
  });

  test('instructor can insert inline equation from slash menu', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'slashinlineeq');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash Inline Eq Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/inline');
    await page.getByTestId('slash-item-inline_equation').click();

    await expect(editor.getByTestId('inline-equation')).toBeVisible();
    await expect(editor.getByTestId('inline-equation-editor')).toBeVisible();
  });

  test('instructor can insert footnote from slash menu', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'slashfootnote');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Slash Footnote Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    const editor = plateEditor(page);
    await editor.click();
    await editor.pressSequentially('/footnote');
    await page.getByTestId('slash-item-footnoteReference').click();

    await expect(editor.getByTestId('footnote-reference')).toBeVisible();
    await expect(editor.getByTestId('footnote-definition')).toBeVisible();
  });
});
