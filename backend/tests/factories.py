import factory
from django.contrib.auth import get_user_model
from factory.django import DjangoModelFactory

from courses.models import Chapter, Course, Enrollment

User = get_user_model()


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    role = User.Role.STUDENT

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        raw = extracted or 'pass12345'
        self.set_password(raw)
        if create:
            self.save()


class InstructorFactory(UserFactory):
    role = User.Role.INSTRUCTOR
    username = factory.Sequence(lambda n: f'instructor{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')


class StudentFactory(UserFactory):
    role = User.Role.STUDENT
    username = factory.Sequence(lambda n: f'student{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')


class CourseFactory(DjangoModelFactory):
    class Meta:
        model = Course

    title = factory.Sequence(lambda n: f'Course {n}')
    description = factory.Faker('paragraph')
    instructor = factory.SubFactory(InstructorFactory)


class ChapterFactory(DjangoModelFactory):
    class Meta:
        model = Chapter

    title = factory.Sequence(lambda n: f'Chapter {n}')
    content = '[]'
    course = factory.SubFactory(CourseFactory)
    is_public = False
    order = factory.Sequence(lambda n: n)


class EnrollmentFactory(DjangoModelFactory):
    class Meta:
        model = Enrollment

    student = factory.SubFactory(StudentFactory)
    course = factory.SubFactory(CourseFactory)
