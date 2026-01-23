import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BookOpen, Sparkles, Video } from "lucide-react"
import { CourseSection } from "@/components/course-section"
import { prisma } from "@/prisma"

// Helper function to format course data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCourse(course: any, recommendationReason?: string) {
   
  const lessonCount = course.modules?.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc: number, module: any) => acc + (module.lessons?.length || 0),
    0
  ) || 0;
  
  const avgRating = course.reviews?.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? course.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / course.reviews.length
    : 0;
  
   
  const totalDuration = course.modules?.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc: number, module: any) => 
      acc + (module.lessons?.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lAcc: number, lesson: any) => lAcc + (lesson.durationMin || 0),
        0
      ) || 0),
    0
  ) || 0;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thumbnail = course.media?.find((m: any) => m.type === 'IMAGE')?.url || '/placeholder-course.jpg';
  
  // Format difficulty to Croatian
  const difficultyMap: Record<string, string> = {
    'EASY': 'Lako',
    'MEDIUM': 'Srednje',
    'HARD': 'Teško',
  };
  
  return {
    id: course.id,
    title: course.title,
    instructor: course.instructor?.name || 'Nepoznati instruktor',
    level: difficultyMap[course.difficulty] || course.difficulty,
    duration: totalDuration > 0 ? `${Math.round(totalDuration / 60)} sati` : undefined,
    rating: avgRating,
    lessonCount,
    image: thumbnail,
    recommendationReason,
  };
}

export default async function AppPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  // Check if user has completed onboarding (has a student profile)
  // Skip check for instructors who might not have student profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentProfile: true,
      instructorProfile: true,
    },
  });

  // If user is not an instructor and doesn't have a student profile, redirect to onboarding
  if (user && !user.studentProfile && user.role === 'STUDENT') {
    redirect("/onboarding");
  }

  // Check if user is a verified instructor or admin
  const isInstructor = user?.instructorProfile?.verified || user?.role === 'ADMIN';

  // Fetch real courses from database
  const courseInclude = {
    instructor: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
    modules: {
      include: {
        lessons: true,
      },
    },
    media: true,
    reviews: {
      select: {
        rating: true,
      },
    },
  };

  const favoriteCuisines = user?.studentProfile?.favoriteCuisines || [];
  const dietaryPreferences = user?.studentProfile?.dietaryPreferences || [];
  const allergies = user?.studentProfile?.allergies || [];

  const progressCourseIds = await prisma.progress.findMany({
    where: {
      userId: session.user.id,
      courseId: {
        not: null,
      },
    },
    select: {
      courseId: true,
    },
  });

  const startedCourseIds = progressCourseIds
    .map((p) => p.courseId)
    .filter((id): id is string => Boolean(id));

  const hasPreferenceSignals = favoriteCuisines.length > 0 || dietaryPreferences.length > 0;
  const hasProgressSignals = startedCourseIds.length > 0;
  const canPersonalize = hasPreferenceSignals || hasProgressSignals;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recommendationWhere: any = {
    published: true,
    deletedAt: null,
    instructorId: {
      not: session.user.id,
    },
  };

  if (startedCourseIds.length > 0) {
    recommendationWhere.id = {
      notIn: startedCourseIds,
    };
  }

  if (allergies.length > 0) {
    recommendationWhere.modules = {
      every: {
        lessons: {
          none: {
            allergenTags: {
              hasSome: allergies,
            },
          },
        },
      },
    };
  }

  const recommendationCandidates = await prisma.course.findMany({
    where: recommendationWhere,
    include: courseInclude,
    take: 50,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch courses the user has started (has progress)
  const enrolledCourses = await prisma.course.findMany({
    where: {
      published: true,
      deletedAt: null,
      progress: {
        some: {
          userId: session.user.id,
          completed: false,
        },
      },
    },
    include: courseInclude,
    take: 5,
  });

  // Fetch popular courses (fallback if no enrolled courses)
  const popularCourses = await prisma.course.findMany({
    where: {
      published: true,
      deletedAt: null,
    },
    include: courseInclude,
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const difficultyBySkill: Record<string, string> = {
    BEGINNER: 'EASY',
    INTERMEDIATE: 'MEDIUM',
    ADVANCED: 'HARD',
  };

  const enrolledCuisineTypes = new Set(
    enrolledCourses.map((course) => course.cuisineType).filter(Boolean)
  );

  const personalizedRecommendations = canPersonalize
    ? recommendationCandidates
        .map((course) => {
          let score = 0;
          const reasons: string[] = [];

          if (course.cuisineType && favoriteCuisines.includes(course.cuisineType)) {
            score += 4;
            reasons.push(`Omiljena kuhinja: ${course.cuisineType}`);
          }

          const dietaryMatch = dietaryPreferences.filter((pref) => course.tags?.includes(pref));
          if (dietaryMatch.length > 0) {
            score += 3;
            reasons.push(`Prehrambena preferencija: ${dietaryMatch[0]}`);
          }

          const expectedDifficulty = user?.studentProfile?.skillLevel
            ? difficultyBySkill[user.studentProfile.skillLevel]
            : undefined;
          if (expectedDifficulty && course.difficulty === expectedDifficulty) {
            score += 2;
            reasons.push("Razina tečaja odgovara Vašoj razini znanja");
          }

          if (course.cuisineType && enrolledCuisineTypes.has(course.cuisineType)) {
            score += 1;
            reasons.push("Slično tečajevima koje trenutno učite");
          }

          if (allergies.length > 0) {
            score += 1;
            reasons.push("Bez označenih alergena");
          }

          return {
            course,
            score,
            reasonText: reasons.slice(0, 2).join(" · ") || "Preporučeno prema Vašem profilu",
          };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
    : [];

  const shouldFallbackToPopular = personalizedRecommendations.length === 0;

  let recommendationNote = "";
  if (!canPersonalize) {
    recommendationNote = `Prikazujemo popularne tečajeve${allergies.length > 0 ? " prilagođene Vašim alergenima" : ""}. Dodajte preferencije u profilu ili upišite tečaj kako bismo mogli personalizirati preporuke.`;
  } else if (shouldFallbackToPopular) {
    recommendationNote = "Trenutno nemamo dovoljno podataka za precizne preporuke. Ažurirajte preferencije ili dovršite tečaj kako bismo mogli poboljšati preporuke.";
  } else {
    recommendationNote = "Preporuke temeljimo na Vašim preferencijama i aktivnosti.";
  }

  // Format courses for display
  const formattedRecommended = shouldFallbackToPopular
    ? popularCourses.map((course) => formatCourse(course))
    : personalizedRecommendations.map((item) => formatCourse(item.course, item.reasonText));
  const formattedEnrolled = enrolledCourses.map((course) => formatCourse(course));
  const formattedPopular = popularCourses.map((course) => formatCourse(course));

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900 overflow-hidden">
      {/* Navigation */}
      <Navbar user={session.user} isInstructor={isInstructor} isAdmin={session.user.role === 'ADMIN'} />
    
      <main className="flex-1 p-6 overflow-auto">
        {/* Section: Moglo bi Vam se svidjeti... */}
        <CourseSection 
          title="Moglo bi Vam se svidjeti..." 
          icon={Sparkles} 
          courses={formattedRecommended.length > 0 ? formattedRecommended : formattedPopular} 
          note={recommendationNote}
          emptyMessage="Nema dostupnih tečajeva koji odgovaraju Vašim preferencijama"
        />

        {/* Section: Vaši tečajevi */}
        <CourseSection 
          title="Nastavite učiti" 
          icon={BookOpen} 
          courses={formattedEnrolled} 
          emptyMessage="Niste još upisani ni na jedan tečaj"
        />

        {/* Section: Popularni tečajevi */}
        <CourseSection 
          title="Popularni tečajevi" 
          icon={Video} 
          courses={formattedPopular} 
          emptyMessage="Nema dostupnih tečajeva"
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
