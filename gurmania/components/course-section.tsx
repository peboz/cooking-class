import { CourseCard } from "@/components/course-card"
import { Skeleton } from "@/components/ui/skeleton"
import { LucideIcon } from "lucide-react"

interface Course {
  id: string
  title: string
  instructor: string
  level: string
  duration?: string
  rating?: number
  lessonCount?: number
  image: string
  recommendationReason?: string
}

interface CourseSectionProps {
  title: string
  icon: LucideIcon
  courses: Course[]
  loading?: boolean
  emptyMessage?: string
  note?: string
}

export function CourseSection({ title, icon: Icon, courses, loading, emptyMessage, note }: CourseSectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Icon className="!w-[1.625rem] !h-[1.625rem]" />
          {title}
        </h2>
        {note && (
          <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
            {note}
          </p>
        )}
      </div>
      
      {/* Responsive grid: 1-2-3-4-5 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-[140px] w-full rounded-t-lg" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : courses.length > 0 ? (
          // Course cards
          courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          // Empty state
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {emptyMessage || "Nema dostupnih tečajeva"}
          </div>
        )}
      </div>
    </section>
  )
}
