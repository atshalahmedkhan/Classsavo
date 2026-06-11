import { test, expect } from '@playwright/test';
import {
  API_BASE,
  applyBoldInPlateEditor,
  applyBoldViaShortcut,
  chapterFormSubmitButton,
  contentJsonHasBoldMark,
  contentJsonLacksBoldMark,
  enrollStudent,
  expectPageTextIsBold,
  fetchChapter,
  fillField,
  loginViaUi,
  openChapterEditor,
  openNewReadingChapterForm,
  plateBoldButton,
  plateEditor,
  registerUser,
  removeBoldInPlateEditor,
  removeBoldViaShortcut,
  seedChapter,
  seedInstructorCourse,
  seedSyllabusChapter,
  switchUserViaUi,
} from './helpers';

const BOLD_PHRASE = 'Bold Playwright phrase';
const NORMAL_PHRASE = 'Normal Playwright phrase';

async function typeInPlateEditor(page: import('@playwright/test').Page, text: string): Promise<void> {
  const editor = plateEditor(page);
  await editor.click();
  await editor.pressSequentially(text, { delay: 15 });
  await expect(editor.getByText(text)).toBeVisible();
}

async function createBoldChapterViaUi(
  page: import('@playwright/test').Page,
  courseId: number,
  title: string,
  applyBold: (page: import('@playwright/test').Page) => Promise<void>,
): Promise<void> {
  await page.goto(`/instructor/courses/${courseId}`);
  await openNewReadingChapterForm(page);
  await fillField(page, 'Title', title);
  await typeInPlateEditor(page, BOLD_PHRASE);
  await applyBold(page);
  await chapterFormSubmitButton(page, 'Add New Reading').click();
  await expect(page.getByText(title)).toBeVisible();
}

test.describe('Plate.js Bold Formatting', () => {
  test('instructor sees bold toolbar when creating a chapter', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'boldtoolbar');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Bold Toolbar Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    await expect(plateBoldButton(page)).toBeVisible();
    await expect(plateBoldButton(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('instructor can apply bold via toolbar button and save it', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'boldbtn');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Bold Button Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');

    await createBoldChapterViaUi(page, courseId, 'Bold Toolbar Chapter', applyBoldInPlateEditor);

    const chapters = await request.get(`${API_BASE}/chapters/?course=${courseId}`, {
      headers: { Authorization: `Bearer ${instructor.access}` },
    });
    const chapterList = await chapters.json();
    const savedChapter = chapterList.find((chapter: { title: string }) => chapter.title === 'Bold Toolbar Chapter');
    expect(savedChapter).toBeTruthy();
    expect(contentJsonHasBoldMark(savedChapter.content)).toBe(true);
  });

  test('instructor can apply bold via Ctrl+B shortcut and save it', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'boldkbd');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Bold Shortcut Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');

    await createBoldChapterViaUi(page, courseId, 'Bold Shortcut Chapter', applyBoldViaShortcut);

    const chapters = await request.get(`${API_BASE}/chapters/?course=${courseId}`, {
      headers: { Authorization: `Bearer ${instructor.access}` },
    });
    const chapterList = await chapters.json();
    const savedChapter = chapterList.find((chapter: { title: string }) => chapter.title === 'Bold Shortcut Chapter');
    expect(savedChapter).toBeTruthy();
    expect(contentJsonHasBoldMark(savedChapter.content)).toBe(true);
  });

  test('instructor can remove bold via toolbar button before saving', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'unboldbtn');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Unbold Button Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    await typeInPlateEditor(page, BOLD_PHRASE);
    await applyBoldViaShortcut(page);
    await removeBoldInPlateEditor(page);

    await expect(plateBoldButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(plateEditor(page).locator('strong.font-bold', { hasText: BOLD_PHRASE })).toHaveCount(0);
  });

  test('instructor can remove bold via Ctrl+B shortcut before saving', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'unboldkbd');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Unbold Shortcut Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openNewReadingChapterForm(page);

    await typeInPlateEditor(page, BOLD_PHRASE);
    await applyBoldViaShortcut(page);
    await removeBoldViaShortcut(page);

    await expect(plateBoldButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(plateEditor(page).locator('strong.font-bold', { hasText: BOLD_PHRASE })).toHaveCount(0);
  });

  test('instructor can unbold a saved chapter and API removes bold mark', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'unboldsave');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Unbold Save Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    const chapterId = await seedChapter(request, instructor.access, courseId, {
      title: 'Previously Bold Chapter',
      isPublic: true,
      content: [{ type: 'p', children: [{ text: BOLD_PHRASE, bold: true }] }],
    });

    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openChapterEditor(page, 'Previously Bold Chapter');

    await expectPageTextIsBold(page, BOLD_PHRASE);
    await removeBoldInPlateEditor(page, BOLD_PHRASE);
    await chapterFormSubmitButton(page, 'Update Reading').click();
    await expect(page.getByText('Chapter updated.')).toBeVisible();

    const savedChapter = await fetchChapter(request, instructor.access, chapterId);
    expect(contentJsonLacksBoldMark(savedChapter.content)).toBe(true);
  });

  test('student sees bold text rendered in chapter reader', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'boldviewins');
    const student = await registerUser(request, 'student', 'boldviewstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Bold View Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    const chapterId = await seedChapter(request, instructor.access, courseId, {
      title: 'Bold View Chapter',
      isPublic: true,
      content: [
        {
          type: 'p',
          children: [{ text: NORMAL_PHRASE }, { text: BOLD_PHRASE, bold: true }],
        },
      ],
    });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}/chapters/${chapterId}`);

    await expect(page.getByText(NORMAL_PHRASE)).toBeVisible();
    await expectPageTextIsBold(page, BOLD_PHRASE);
    await expect(plateBoldButton(page)).not.toBeVisible();
  });

  test('student sees unbolded text after instructor removes bold formatting', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'unboldviewins');
    const student = await registerUser(request, 'student', 'unboldviewstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Unbold View Course');
    await seedSyllabusChapter(request, instructor.access, courseId);
    const chapterId = await seedChapter(request, instructor.access, courseId, {
      title: 'Unbold View Chapter',
      isPublic: true,
      content: [{ type: 'p', children: [{ text: BOLD_PHRASE, bold: true }] }],
    });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openChapterEditor(page, 'Unbold View Chapter');
    await removeBoldInPlateEditor(page, BOLD_PHRASE);
    await chapterFormSubmitButton(page, 'Update Reading').click();
    await expect(page.getByText('Chapter updated.')).toBeVisible();

    const savedChapter = await fetchChapter(request, instructor.access, chapterId);
    expect(contentJsonLacksBoldMark(savedChapter.content)).toBe(true);

    await switchUserViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}/chapters/${chapterId}`);

    await expect(page.getByText(BOLD_PHRASE)).toBeVisible();
    await expect(page.locator('strong.font-bold', { hasText: BOLD_PHRASE })).toHaveCount(0);
  });
});
