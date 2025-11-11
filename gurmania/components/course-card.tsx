import Image from "next/image"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface CourseCardProps {
  course: {
    title: string
    instructor: string
    level: string
    duration: string
    rating: string
    image: string
  }
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card
      className="flex flex-row items-center gap-0 overflow-hidden transform transition duration-200 ease-out hover:scale-105 hover:shadow-xl hover:border-orange-200/70 hover:bg-card/90 active:translate-y-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/40"
    >
      <div className="w-36 h-28 flex-shrink-0 pl-3">
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          <Image src={course.image} alt={course.title} fill unoptimized={true} className="object-cover" />
        </div>
      </div>
      <CardContent className="px-3 py-2 flex-1 flex flex-col justify-center">
        <CardTitle className="text-sm mb-1">{course.title}</CardTitle>
        <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mb-2">{course.instructor}</CardDescription>
        <div className="flex flex-col items-start gap-2 text-xs">
          <Badge variant="secondary" className="text-xs">{course.level}</Badge>
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" /> {course.duration}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
