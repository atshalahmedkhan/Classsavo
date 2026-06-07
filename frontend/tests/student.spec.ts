import { test, expect } from '@playwright/test';
import {
  API_BASE,
  enrollStudent,
  fillField,
  joinCourseModal,
  joinModalEnrollButton,
  loginViaUi,
  openJoinCourseModal,
  registerUser,
  seedChapter,
  seedInstructorCourse,
  uniqueId,
} from './helpers';

test.describe('Student Flow', () => {
  test('student can see enrolled courses on My Courses page', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'mycins');
    const student = await registerUser(request, 'student', 'mycstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Enrolled Course');
    await seedChapter(request, instructor.access, courseId, { title: 'Public Chapter', isPublic: true });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student/my-courses');
    await expect(page.getByText('Enrolled Course')).toBeVisible();
  });

  test('student can search on Discover page and results filter correctly', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'discins');
    const student = await registerUser(request, 'student', 'discstu');
    const pythonTitle = `Python Programming ${uniqueId('py')}`;
    const biologyTitle = `Biology Basics ${uniqueId('bio')}`;
    await seedInstructorCourse(request, instructor.access, biologyTitle);
    await seedInstructorCourse(request, instructor.access, pythonTitle);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student/discover');
    await page.getByRole('searchbox').fill('Python');
    await expect(page.getByRole('heading', { name: pythonTitle })).toBeVisible();
    await expect(page.getByRole('heading', { name: biologyTitle })).not.toBeVisible();
  });

  test('join course modal shows error with wrong access code', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'joinins');
    const student = await registerUser(request, 'student', 'joinstu');
    await seedInstructorCourse(request, instructor.access, 'Join Target Course');

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student/discover');
    await openJoinCourseModal(page);
    await joinCourseModal(page).getByPlaceholder('Access code').fill('wrongcode');
    await joinModalEnrollButton(page).click();
    await expect(page.getByText(/invalid access code/i)).toBeVisible();
  });

  test('student can join course with correct access code', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'goodjoinins');
    const student = await registerUser(request, 'student', 'goodjoinstu');
    const { accessCode } = await seedInstructorCourse(request, instructor.access, 'Joinable Course');

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student/discover');
    await openJoinCourseModal(page);
    await joinCourseModal(page).getByPlaceholder('Access code').fill(accessCode);
    await joinModalEnrollButton(page).click();
    await page.waitForURL(/\/student\/enrolled\/\d+/);
    await page.goto('/student/my-courses');
    await expect(page.getByText('Joinable Course')).toBeVisible();
  });

  test('student can open enrolled course and see public chapters in sidebar', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'sideins');
    const student = await registerUser(request, 'student', 'sidestu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Sidebar Course');
    await seedChapter(request, instructor.access, courseId, { title: 'Visible Chapter', isPublic: true });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}`);
    await expect(page.getByText('Visible Chapter')).toBeVisible();
  });

  test('student cannot see private chapters in curriculum', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'privins');
    const student = await registerUser(request, 'student', 'privstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Private Course');
    await seedChapter(request, instructor.access, courseId, { title: 'Secret Chapter', isPublic: false });
    await seedChapter(request, instructor.access, courseId, { title: 'Open Chapter', isPublic: true });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}`);
    await expect(page.getByText('Open Chapter')).toBeVisible();
    await expect(page.getByText('Secret Chapter')).not.toBeVisible();
  });

  test('student can open chapter and see Plate.js content rendered', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'readins');
    const student = await registerUser(request, 'student', 'readstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Reader Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, {
      title: 'Reader Chapter',
      isPublic: true,
      content: [{ type: 'p', children: [{ text: 'Unique Playwright content marker' }] }],
    });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}/chapters/${chapterId}`);
    await expect(page.getByText('Unique Playwright content marker')).toBeVisible();
  });

  test('reading timer shows active time indicator when chapter is opened', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'timerins');
    const student = await registerUser(request, 'student', 'timerstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Timer Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, {
      title: 'Timer Chapter',
      isPublic: true,
    });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}/chapters/${chapterId}`);
    await expect(page.getByText(/Active: .* \/ .* required/)).toBeVisible();
    await expect(page.getByText(/Reading:/)).toBeVisible();
  });

  test('reading timer pauses when tab is hidden', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'visins');
    const student = await registerUser(request, 'student', 'visstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Visibility Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, { title: 'Vis Chapter', isPublic: true });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}/chapters/${chapterId}`);
    await page.locator('[tabindex="0"]').dispatchEvent('mousemove');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByText(/\(paused\)/)).toBeVisible();
  });

  test('chapter marked as read shows green badge after progress API update', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'readbadgeins');
    const student = await registerUser(request, 'student', 'readbadgestu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Read Badge Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, { title: 'Done Chapter', isPublic: true });
    await enrollStudent(request, student.access, courseId, accessCode);
    await request.post(`${API_BASE}/chapters/${chapterId}/progress/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: { time_spent_seconds: 9999, is_read: true },
    });

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}/chapters/${chapterId}`);
    await expect(page.getByText('Marked as Read')).toBeVisible();
  });

  test('progress page shows updated read count after reading a chapter', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'progins');
    const student = await registerUser(request, 'student', 'progstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Progress Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, { title: 'Progress Chapter', isPublic: true });
    await enrollStudent(request, student.access, courseId, accessCode);
    await request.post(`${API_BASE}/chapters/${chapterId}/progress/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: { time_spent_seconds: 120, is_read: true },
    });

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student');
    await expect(page.getByText('1 / 1 chapters read')).toBeVisible();
  });

  test('student can send message to instructor from messages page', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'msgins');
    const student = await registerUser(request, 'student', 'msgstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Message Course');
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/messages?user=${instructor.user.id}&course=${courseId}`);
    await page.getByPlaceholder('Type a message...').fill('Hello instructor from Playwright');
    await page.getByPlaceholder('Type a message...').press('Enter');
    await expect(page.getByText('Hello instructor from Playwright')).toBeVisible();
  });

  test('student notification bell shows unread badge when notification exists', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'bellins');
    const student = await registerUser(request, 'student', 'bellstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Bell Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, { title: 'Bell Chapter', isPublic: false });
    await enrollStudent(request, student.access, courseId, accessCode);
    await request.patch(`${API_BASE}/chapters/${chapterId}/toggle-visibility/`, {
      headers: { Authorization: `Bearer ${instructor.access}` },
    });

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText(/New chapter published/i)).toBeVisible();
  });

  test('clicking a notification navigates to the chapter page', async ({ page, request }) => {
    const instructor = await registerUser(request, 'instructor', 'navins');
    const student = await registerUser(request, 'student', 'navstu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Nav Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, {
      title: 'Nav Chapter',
      isPublic: false,
    });
    await enrollStudent(request, student.access, courseId, accessCode);
    await request.patch(`${API_BASE}/chapters/${chapterId}/toggle-visibility/`, {
      headers: { Authorization: `Bearer ${instructor.access}` },
    });

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.getByRole('button', { name: 'Notifications' }).click();
    await page.getByText(/New chapter published/i).click();
    await page.waitForURL(`/student/courses/${courseId}/chapters/${chapterId}`);
  });

  test('reading timer pauses after 30 seconds of no activity', async ({ page, request }) => {
    test.setTimeout(45_000);
    const instructor = await registerUser(request, 'instructor', 'idleins');
    const student = await registerUser(request, 'student', 'idlestu');
    const { courseId, accessCode } = await seedInstructorCourse(request, instructor.access, 'Idle Course');
    const chapterId = await seedChapter(request, instructor.access, courseId, { title: 'Idle Chapter', isPublic: true });
    await enrollStudent(request, student.access, courseId, accessCode);

    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto(`/student/courses/${courseId}/chapters/${chapterId}`);
    await page.locator('[tabindex="0"]').dispatchEvent('mousemove');
    await page.waitForTimeout(31_000);
    await expect(page.getByText(/\(paused\)/)).toBeVisible();
  });

  test('settings change password succeeds with correct input', async ({ page, request }) => {
    const student = await registerUser(request, 'student', 'pwstu');
    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student/settings');
    await fillField(page, 'Current Password', student.password);
    await fillField(page, 'New Password', 'newpass123');
    await fillField(page, 'Confirm New Password', 'newpass123');
    await page.getByRole('button', { name: 'Update Password' }).click();
    await expect(page.getByText('Password updated successfully')).toBeVisible();
  });

  test('settings change password shows error with wrong current password', async ({ page, request }) => {
    const student = await registerUser(request, 'student', 'pwbstu');
    await loginViaUi(page, student.user.username, student.password, '/student');
    await page.goto('/student/settings');
    await fillField(page, 'Current Password', 'wrongpassword');
    await fillField(page, 'New Password', 'newpass123');
    await fillField(page, 'Confirm New Password', 'newpass123');
    await page.getByRole('button', { name: 'Update Password' }).click();
    await expect(page.getByText(/incorrect/i)).toBeVisible();
  });
});
