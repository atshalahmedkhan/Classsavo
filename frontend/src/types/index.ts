import type { Value } from '@udecode/plate';

export type UserRole = 'instructor' | 'student';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: User;
  created_at: string;
  chapter_count: number;
  is_enrolled: boolean;
  enrollment_count: number | null;
  access_code?: string | null;
  thumbnail_url?: string | null;
}

export interface ChapterFile {
  id: number;
  chapter: number;
  file_name: string;
  uploaded_at: string;
  file_url: string;
  has_pdf_preview?: boolean;
}

export interface Chapter {
  id: number;
  title: string;
  content: Value;
  course: number;
  is_public: boolean;
  order: number;
  assignment_instructions?: string;
  due_date?: string | null;
  files?: ChapterFile[];
}

export interface Enrollment {
  id: number;
  student: User;
  course: Course;
  enrolled_at: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
}

export interface ChapterProgress {
  id: number;
  chapter_id: number;
  course_id: number;
  time_spent_seconds: number;
  is_read: boolean;
  last_updated: string;
}

export interface StudentProgressSummary {
  chapters_read: number;
  total_chapters: number;
  total_active_seconds: number;
}

export interface StudentCourseProgress {
  course_id: number;
  course_title: string;
  chapters_read: number;
  total_chapters: number;
}

export interface StudentProgressResponse {
  records: ChapterProgress[];
  summary: StudentProgressSummary;
  courses: StudentCourseProgress[];
}

export interface StudentAssignment {
  chapter_id: number;
  chapter_title: string;
  course_id: number;
  course_name: string;
  assignment_instructions: string;
  due_date: string | null;
  is_read: boolean;
  time_spent_seconds: number;
  order: number;
}

export type NotificationType = 'new_message' | 'new_chapter' | 'assignment_due';

export interface AppNotification {
  id: number;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  created_at: string;
  course_id: number | null;
  chapter_id: number | null;
}

export interface CourseProgressReport {
  students: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
  chapters: Array<{ id: number; title: string; order: number }>;
  progress: Array<{
    student_id: number;
    chapter_id: number;
    time_spent_seconds: number;
    is_read: boolean;
  }>;
}

export interface Message {
  id: number;
  sender: User;
  receiver: User;
  course: number | null;
  body: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  user: User;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  course_id: number | null;
  course_title: string | null;
}
