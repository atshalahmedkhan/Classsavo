import { test, expect } from '@playwright/test';
import { enrollStudent, joinModalEnrollButton, loginViaUi, openChapterEditor, openJoinCourseModal, registerUser, seedChapter, seedInstructorCourse } from './helpers';

test.describe('Edge Cases', () => {
  test('student navigating to instructor area is redirected to student dashboard', async ({ page, request }) => {
    const student = await registerUser(request, 'student', 'crossstu');
    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/instructor');
    await page.waitForURL('/student');
  });

  test('instructor navigating to student my-courses is redirected to instructor dashboard', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'crossins');
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto('/student/my-courses');
    await page.waitForURL('/instructor');
  });

  test('joining a course with empty access code keeps enroll button disabled', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'emptyjoinins');
    const student = await registerUser(request, 'student', 'emptyjoinstu');
    await seedInstructorCourse(request, instructor.access, 'Empty Code Course');

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student/discover');
    await openJoinCourseModal(page);
    await expect(joinModalEnrollButton(page)).toBeDisabled();
  });

  test('course with no public chapters shows empty message for enrolled student', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'emptychins');
    const student = await registerUser(request, 'student', 'emptychstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Empty Chapter Course');
    await seedChapter(request, instructor.access, courseId, { title: 'Private Only', isPublic: false });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}`);
    await expect(page.getByText('No public chapters available yet.')).toBeVisible();
  });

  test('progress page shows zero percent when no chapters read', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'zeroins');
    const student = await registerUser(request, 'student', 'zerostu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Zero Progress Course');
    await seedChapter(request, instructor.access, courseId, { title: 'Unread Chapter', isPublic: true });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student');
    await expect(page.getByText('0 / 1 chapters read')).toBeVisible();
    await expect(page.getByText('0% complete across all courses')).toBeVisible();
  });

  test('opening chapter with empty content does not crash the page', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'emptycontentins');
    const student = await registerUser(request, 'student', 'emptycontentstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Empty Content Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, {
      title: 'Empty Chapter',
      isPublic: true,
      content: [],
    });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}/chapters/${chapterId}`);
    await expect(page.getByRole('heading', { name: 'Chapter content', exact: true })).toBeVisible();
  });

  test('uploading unsupported file type shows client-side error', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'badfileins');
    const { courseId } = await seedInstructorCourse(request, instructor.access, 'Bad File Course');
    await seedChapter(request, instructor.access, courseId, { title: 'File Chapter', isPublic: true });
    await loginViaUi(page, instructor.user.username, instructor.password, '/instructor');
    await page.goto(`/instructor/courses/${courseId}`);
    await openChapterEditor(page, 'File Chapter');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'bad.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('not allowed'),
    });
    await expect(page.getByText('Only PDF, DOCX, PNG, and JPG files are allowed.')).toBeVisible();
  });

  test('sending an empty message is blocked by the UI', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'emptymsgins');
    const student = await registerUser(request, 'student', 'emptymsgstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Empty Message Course');
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/messages?user=${instructor.user.id}&course=${courseId}`);
    const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await expect(sendButton).toBeDisabled();
  });
});
