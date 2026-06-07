import { Link } from 'react-router-dom';
import { BookOpen, Compass, Mail, MessageCircle, Settings } from 'lucide-react';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';

const faqs = [
  {
    question: 'How do I join a course?',
    answer:
      'Go to Discover, choose a course, and enter the access code from your instructor. You can also join from a course page before enrolling.',
  },
  {
    question: 'Where can I see my progress?',
    answer:
      'Open Progress in the sidebar to view chapters read, assignments, and reading time across all enrolled courses.',
  },
  {
    question: 'How do I contact my instructor?',
    answer:
      'Use Messages in the sidebar, or open a course you are enrolled in and click Message Instructor on the course page.',
  },
  {
    question: 'Why is a chapter marked as read?',
    answer:
      'A chapter is marked read after you spend enough active reading time on it. Idle tabs do not count toward progress.',
  },
];

const quickLinks = [
  { to: '/student/discover', label: 'Discover courses', icon: Compass },
  { to: '/student/my-courses', label: 'My courses', icon: BookOpen },
  { to: '/student/messages', label: 'Messages', icon: MessageCircle },
  { to: '/student/settings', label: 'Account settings', icon: Settings },
];

export function StudentHelpPage() {
  return (
    <>
      <StudentHeader
        title="Help Center"
        subtitle="Answers and quick links to get you back on track."
        showSearch={false}
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Need help?</CardTitle>
            <CardDescription className="mt-2">
              Browse common questions below or jump to the area you need. For account issues, check
              Settings to update your password or profile details.
            </CardDescription>
            <div className="mt-4 flex items-center gap-2 text-sm text-[#6b5c52]">
              <Mail className="h-4 w-4 shrink-0 text-[#c2622a]" />
              <span>
                Instructor questions? Message them directly from{' '}
                <Link to="/student/messages" className="font-medium text-[#c2622a] hover:underline">
                  Messages
                </Link>
                .
              </span>
            </div>
          </Card>

          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Frequently asked questions</CardTitle>
            <div className="mt-4 space-y-4">
              {faqs.map((item) => (
                <div key={item.question} className="rounded-xl border border-[#e8ddd0] bg-[#faf6f1]/50 p-4">
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
