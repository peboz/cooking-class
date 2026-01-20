/**
 * Helper functions for course and instructor data transformation
 */

import { Difficulty } from "@/app/generated/prisma/client";

export interface LandingPageCourse {
  id: string;
  title: string;
  instructor: string;
  level: string;
  duration: string;
  rating: string;
  image: string;
}

export interface LandingPageInstructor {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

type CourseWithRelations = {
  id: string;
  title: string;
  difficulty: Difficulty;
  instructor: {
    name: string | null;
  } | null;
  modules: Array<{
    lessons: Array<{
      durationMin: number | null;
    }>;
  }>;
  media: Array<{
    url: string;
    type: string;
  }>;
  reviews: Array<{
    rating: number;
  }>;
};

/**
 * Maps Prisma Difficulty enum to Croatian difficulty strings
 */
function mapDifficultyToCroatian(difficulty: Difficulty): string {
  const difficultyMap: Record<Difficulty, string> = {
    EASY: "Početnik",
    MEDIUM: "Srednji",
    HARD: "Napredni",
  };
  return difficultyMap[difficulty] || difficulty;
}

/**
 * Formats a database course for display on the landing page
 */
export function formatCourseForLanding(course: CourseWithRelations): LandingPageCourse {
  // Calculate total lesson count
  const lessonCount = course.modules?.reduce(
    (acc, module) => acc + (module.lessons?.length || 0),
    0
  ) || 0;

  // Calculate average rating
  const avgRating =
    course.reviews?.length > 0
      ? course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length
      : 0;

  // Calculate total duration in minutes
  const totalDurationMin = course.modules?.reduce(
    (acc, module) =>
      acc +
      (module.lessons?.reduce((lAcc, lesson) => lAcc + (lesson.durationMin || 0), 0) || 0),
    0
  ) || 0;

  // Convert to hours and format
  const durationHours = Math.round(totalDurationMin / 60);
  const durationStr = durationHours > 0 ? `${durationHours} sati` : "N/A";

  // Get thumbnail image
  const thumbnail =
    course.media?.find((m) => m.type === "IMAGE")?.url || "/images/course-placeholder.jpg";

  // Get instructor name
  const instructorName = course.instructor?.name || "Nepoznati instruktor";

  // Map difficulty to Croatian
  const level = mapDifficultyToCroatian(course.difficulty);

  return {
    id: course.id,
    title: course.title,
    instructor: instructorName,
    level,
    duration: durationStr,
    rating: avgRating > 0 ? avgRating.toFixed(1) : "N/A",
    image: thumbnail,
  };
}

/**
 * Ensures we have at least minCount courses by duplicating if necessary
 */
export function ensureMinimumCourses(
  courses: LandingPageCourse[],
  minCount: number
): LandingPageCourse[] {
  if (courses.length === 0) {
    // Return empty array if no courses at all
    return [];
  }

  if (courses.length >= minCount) {
    return courses;
  }

  // Duplicate courses to reach minimum count
  const result = [...courses];
  while (result.length < minCount) {
    const remaining = minCount - result.length;
    const toAdd = Math.min(remaining, courses.length);
    result.push(...courses.slice(0, toAdd));
  }

  return result;
}

/**
 * Type for User with InstructorProfile relation
 */
type InstructorWithProfile = {
  id: string;
  name: string | null;
  image: string | null;
  instructorProfile: {
    specializations: string[];
  } | null;
};

/**
 * Formats a database user (instructor) for display on the landing page
 */
export function formatInstructorForLanding(
  instructor: InstructorWithProfile
): LandingPageInstructor {
  // Get instructor name with fallback
  const name = instructor.name || "Nepoznati instruktor";

  // Get first specialization or default
  const specialty =
    instructor.instructorProfile?.specializations?.[0] || "Kuharska umjetnost";

  // Generate initials from name for avatar fallback
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return {
    id: instructor.id,
    name,
    specialty,
    image: initials,
  };
}
