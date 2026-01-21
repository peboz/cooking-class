import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BookOpen, Sparkles, Video } from "lucide-react"
import { CourseSection } from "@/components/course-section"
import { prisma } from "@/prisma"

// Helper function to format course data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCourse(course: any) {
   
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

  // Fetch recommended courses based on user preferences
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recommendedWhere: any = {
    published: true,
  };
  
  // If user has favorite cuisines, filter by those
  if (user?.studentProfile?.favoriteCuisines && user.studentProfile.favoriteCuisines.length > 0) {
    recommendedWhere.cuisineType = {
      in: user.studentProfile.favoriteCuisines,
    };
  }

  const recommendedCourses = await prisma.course.findMany({
    where: recommendedWhere,
    include: courseInclude,
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch courses the user has started (has progress)
  const enrolledCourses = await prisma.course.findMany({
    where: {
      published: true,
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
    },
    include: courseInclude,
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Format courses for display
  const formattedRecommended = recommendedCourses.map(formatCourse);
  const formattedEnrolled = enrolledCourses.map(formatCourse);
  const formattedPopular = popularCourses.map(formatCourse);

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
