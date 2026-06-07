import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, MessageCircle, Settings, Users } from 'lucide-react';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';

const faqs = [
  {
    question: 'How do I create a course?',
    answer:
      'Click Create New Course in the sidebar or the + New Course button. Add a title, description, optional thumbnail, then build chapters from the course page.',
  },
  {
    question: 'How do students join my course?',
    answer:
      'Each course gets an access code. Share it with students — they enter it on Discover or the course page to enroll instantly.',
  },
  {
    question: 'How do I publish a chapter?',
    answer:
      'Open your course, edit a chapter, and toggle visibility to PUBLIC. Students only see chapters marked public.',
  },
  {
    question: 'How do I track student progress?',
    answer:
      'Open Student Performance in the sidebar, or view the Progress tab inside any course to see reading time and completion.',
  },
];

const quickLinks = [
  { to: '/instructor/courses', label: 'My courses', icon: BookOpen },
  { to: '/instructor/courses/new', label: 'Create a course', icon: BookOpen },
  { to: '/instructor/students', label: 'Students', icon: Users },
  { to: '/instructor/messages', label: 'Messages', icon: MessageCircle },
  { to: '/instructor/analytics', label: 'Student performance', icon: BarChart3 },
  { to: '/instructor/settings', label: 'Account settings', icon: Settings },
];

export function InstructorHelpPage() {
  return (
    <>
      <InstructorHeader
        title="Help & Support"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'Help' }]}
        showSearch={false}
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Need help?</CardTitle>
            <CardDescription className="mt-2">
              Browse common questions below or use the quick links to jump to the right part of your
              portal. Update your profile and password anytime from Settings.
            </CardDescription>
          </Card>

          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Frequently asked questions</CardTitle>
            <div className="mt-4 space-y-4">
              {faqs.map((item) => (
                <div
                  key={item.question}
                  className="rounded-xl border border-[#e8ddd0] bg-[#faf6f1]/50 p-4"
                >
                  <p className="font-serif font-semibold text-[#2c1810]">{item.question}</p>
                  <p className="mt-2 text-sm text-[#6b5c52]">{item.answer}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Quick links</CardTitle>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {quickLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-xl border border-[#e8ddd0] bg-[#faf6f1]/50 px-4 py-3 text-sm font-medium text-[#2c1810] transition-colors hover:border-[#c2622a]/40 hover:bg-[#c2622a]/5"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#c2622a]" />
                  {label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
