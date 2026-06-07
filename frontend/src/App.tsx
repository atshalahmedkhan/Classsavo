import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import { InstructorLayout } from '@/components/instructor/InstructorLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import LandingPage from '@/pages/LandingPage';
import { StudentProgressPage } from '@/pages/student/StudentProgressPage';
import { StudentMyCoursesPage } from '@/pages/student/StudentMyCoursesPage';
import { StudentDiscoverPage } from '@/pages/student/StudentDiscoverPage';
import { StudentCoursePage } from '@/pages/student/StudentCoursePage';
import { ChapterReaderPage } from '@/pages/student/ChapterReaderPage';
import { EnrollmentSuccessPage } from '@/pages/student/EnrollmentSuccessPage';
import { StudentResourcesPage } from '@/pages/student/StudentResourcesPage';
import { StudentHelpPage } from '@/pages/student/StudentHelpPage';
import { StudentSettingsPage } from '@/pages/student/StudentSettingsPage';
import { StudentMessagesPage } from '@/pages/student/StudentMessagesPage';
import { InstructorOverviewPage } from '@/pages/instructor/InstructorOverviewPage';
import { InstructorCoursesPage } from '@/pages/instructor/InstructorCoursesPage';
import { CreateCoursePage } from '@/pages/instructor/CreateCoursePage';
import { InstructorCoursePage } from '@/pages/instructor/InstructorCoursePage';
import { InstructorAnalyticsPage } from '@/pages/instructor/InstructorAnalyticsPage';
import { InstructorStudentsPage } from '@/pages/instructor/InstructorStudentsPage';
import { InstructorAssignmentsPage } from '@/pages/instructor/InstructorAssignmentsPage';
import { InstructorSettingsPage } from '@/pages/instructor/InstructorSettingsPage';
import { InstructorMessagesPage } from '@/pages/instructor/InstructorMessagesPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<LandingPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<StudentProgressPage />} />
                <Route path="dashboard" element={<StudentDiscoverPage />} />
                <Route path="my-courses" element={<StudentMyCoursesPage />} />
                <Route path="discover" element={<StudentDiscoverPage />} />
                <Route path="resources" element={<StudentResourcesPage />} />
                <Route path="help" element={<StudentHelpPage />} />
                <Route path="settings" element={<StudentSettingsPage />} />
                <Route path="messages" element={<StudentMessagesPage />} />
                <Route path="courses/:courseId" element={<StudentCoursePage />} />
                <Route path="courses/:courseId/chapters/:chapterId" element={<ChapterReaderPage />} />
                <Route path="enrolled/:courseId" element={<EnrollmentSuccessPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
              <Route path="/instructor" element={<InstructorLayout />}>
                <Route index element={<InstructorOverviewPage />} />
                <Route path="courses" element={<InstructorCoursesPage />} />
                <Route path="courses/new" element={<CreateCoursePage />} />
                <Route path="courses/:courseId" element={<InstructorCoursePage />} />
                <Route path="analytics" element={<InstructorAnalyticsPage />} />
                <Route path="students" element={<InstructorStudentsPage />} />
                <Route path="assignments" element={<InstructorAssignmentsPage />} />
                <Route path="settings" element={<InstructorSettingsPage />} />
                <Route path="messages" element={<InstructorMessagesPage />} />
                <Route path="dashboard" element={<Navigate to="/instructor" replace />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
