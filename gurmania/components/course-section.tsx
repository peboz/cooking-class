import { CourseCard } from "@/components/course-card"
import { LucideIcon } from "lucide-react"

interface Course {
  title: string
  instructor: string
  level: string
  duration: string
  rating: string
  image: string
}

interface CourseSectionProps {
  title: string
  icon: LucideIcon
  courses: Course[]
}

export function CourseSection({ title, icon: Icon, courses }: CourseSectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Icon className="!w-[1.625rem] !h-[1.625rem]" />
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {courses.map((course) => (
          <CourseCard key={course.title + '-' + course.instructor} course={course} />
        ))}
      </div>
    </section>
  )
}
