import { Outlet } from 'react-router-dom';
import { InstructorSidebar } from './InstructorSidebar';

export function InstructorLayout() {
  return (
    <div className="ghibli-paper flex min-h-screen bg-[#faf6f1]">
      <InstructorSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-visible">
        <Outlet />
      </div>
    </div>
  );
}
