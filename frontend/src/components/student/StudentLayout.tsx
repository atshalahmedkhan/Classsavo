import { Outlet, useLocation } from 'react-router-dom';
import { StudentSidebar } from './StudentSidebar';

export function StudentLayout() {
  const location = useLocation();

  return (
    <div className="ghibli-paper flex min-h-screen bg-[#faf6f1]">
      <StudentSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-visible">
        <Outlet key={location.pathname} />
      </div>
    </div>
  );
}
