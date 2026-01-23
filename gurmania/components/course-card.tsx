"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, Star, BookOpen, Info } from "lucide-react"

interface CourseCardProps {
  course: {
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
  href?: string
}

export function CourseCard({ course, href }: CourseCardProps) {
  const cardHref = href || `/app/courses/${course.id}`
  
  return (
    <Link href={cardHref} className="group block">
      <Card className="overflow-hidden p-0 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/40">
        {/* Image with blur gradient overlay */}
        <div className="relative h-[140px] w-full overflow-hidden">
          <Image 
            src={course.image} 
            alt={course.title} 
            fill 
            unoptimized={true} 
            className="object-cover transition-transform duration-300 group-hover:scale-110" 
          />
          {/* Blur gradient overlay on bottom 40% */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Compact content section */}
        <CardContent className="p-3 space-y-2">
          {/* Title - max 2 lines */}
          <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight">
            {course.title}
          </CardTitle>

          {course.recommendationReason && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                Preporuka
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                    aria-label="Zašto je preporučeno"
                  >
                    <Info className="w-3 h-3" />
                    Zašto?
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {course.recommendationReason}
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Instructor - truncated */}
          <CardDescription className="text-xs truncate">
            {course.instructor}
          </CardDescription>

          {/* Badges inline */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {course.level}
            </Badge>
            {course.duration && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {course.duration}
              </Badge>
            )}
          </div>

          {/* Meta info - rating and lesson count */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {course.rating !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{course.rating.toFixed(1)}</span>
              </div>
            )}
            {course.lessonCount !== undefined && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{course.lessonCount} lekcija</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
