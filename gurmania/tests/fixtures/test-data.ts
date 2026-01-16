/**
 * Test data fixtures for use across tests
 */

export const testUsers = {
  student: {
    id: 'student-1',
    name: 'Test Student',
    email: 'student@test.com',
    emailVerified: new Date(),
    password: '$2a$10$hashedpassword',
    role: 'STUDENT' as const,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  instructor: {
    id: 'instructor-1',
    name: 'Test Instructor',
    email: 'instructor@test.com',
    emailVerified: new Date(),
    password: '$2a$10$hashedpassword',
    role: 'INSTRUCTOR' as const,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  admin: {
    id: 'admin-1',
    name: 'Test Admin',
    email: 'admin@test.com',
    emailVerified: new Date(),
    password: '$2a$10$hashedpassword',
    role: 'ADMIN' as const,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const testCourse = {
  id: 'course-1',
  instructorId: 'instructor-1',
  title: 'Test Cooking Course',
  description: 'A test course description',
  difficulty: 'EASY' as const,
  cuisineType: 'Italian',
  tags: ['pasta', 'basics'],
  published: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const testLesson = {
  id: 'lesson-1',
  moduleId: 'module-1',
  title: 'Test Lesson',
  description: 'Test lesson description',
  videoUrl: 'https://youtube.com/watch?v=test',
  steps: 'Step 1, Step 2',
  durationMin: 30,
  difficulty: 'EASY' as const,
  prepTimeMin: 10,
  cookTimeMin: 20,
  cuisineType: 'Italian',
  allergenTags: [],
  order: 0,
  published: true,
};

export const testComment = {
  id: 'comment-1',
  lessonId: 'lesson-1',
  userId: 'student-1',
  content: 'Great lesson!',
  isQuestion: false,
  status: 'PENDING' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};
