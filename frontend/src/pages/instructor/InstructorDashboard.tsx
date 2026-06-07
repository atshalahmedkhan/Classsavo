import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { coursesApi } from '@/api/courses';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { Course } from '@/types';

export function InstructorDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await coursesApi.list();
      setCourses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await coursesApi.create(form);
      setForm({ title: '', description: '' });
      setShowForm(false);
      await loadCourses();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course and all its chapters?')) return;
    await coursesApi.delete(id);
    await loadCourses();
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading courses...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and chapters.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Course'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardTitle>Create Course</CardTitle>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Course'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardTitle>{course.title}</CardTitle>
            <CardDescription className="mt-2">{course.description}</CardDescription>
            <p className="mt-2 text-sm text-muted-foreground">
              {course.chapter_count} chapters · {course.enrollment_count ?? 0} students
            </p>
            <div className="mt-4 flex gap-2">
              <Link to={`/instructor/courses/${course.id}`}>
                <Button size="sm">Manage</Button>
              </Link>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(course.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
