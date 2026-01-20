"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { InfiniteSlider } from "@/components/motion-primitives/infinite-slider";
import Image from "next/image";
import { ChefHat, Clock, Star } from "lucide-react";
import type { LandingPageCourse } from "@/lib/course-helpers";

interface HeroSliderProps {
  coursesSet1: LandingPageCourse[];
  coursesSet2: LandingPageCourse[];
}

export function HeroSlider({ coursesSet1, coursesSet2 }: HeroSliderProps) {
  return (
    <motion.div
      className="relative h-[700px] md:h-[800px] flex gap-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* Left Column - Scrolling Down */}
      <div className="relative flex-1 h-full overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-50 via-orange-50/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 dark:to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-50 via-orange-50/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 dark:to-transparent z-10 pointer-events-none" />
        <InfiniteSlider direction="vertical" speed={25} gap={24}>
          {coursesSet1.map((course, index) => (
            <Card
              key={`${course.id}-${index}`}
              className="w-[280px] rounded-2xl overflow-hidden border-2 hover:border-orange-200 transition-colors p-0"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                  unoptimized={course.image.startsWith("http")}
                />
              </div>
              <div className="px-3 pb-3 pt-1">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm mb-0.5 line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <ChefHat className="w-3 h-3" />
                      <span className="line-clamp-1">{course.instructor}</span>
                    </p>
                  </div>
                  {course.rating !== "N/A" && (
                    <div className="flex items-center gap-1 text-amber-500 ml-2 flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span className="text-xs font-semibold">{course.rating}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    Težina: {course.level}
                  </Badge>
                  {course.duration !== "N/A" && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.duration}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </InfiniteSlider>
      </div>

      {/* Right Column - Scrolling Up */}
      <div className="relative flex-1 h-full overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-50 via-orange-50/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 dark:to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-50 via-orange-50/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 dark:to-transparent z-10 pointer-events-none" />
        <InfiniteSlider direction="vertical" reverse speed={25} gap={24}>
          {coursesSet2.map((course, index) => (
            <Card
              key={`${course.id}-${index}`}
              className="w-[280px] rounded-2xl overflow-hidden border-2 hover:border-orange-200 transition-colors p-0"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                  unoptimized={course.image.startsWith("http")}
                />
              </div>
              <div className="px-3 pb-3 pt-1">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm mb-0.5 line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <ChefHat className="w-3 h-3" />
                      <span className="line-clamp-1">{course.instructor}</span>
                    </p>
                  </div>
                  {course.rating !== "N/A" && (
                    <div className="flex items-center gap-1 text-amber-500 ml-2 flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span className="text-xs font-semibold">{course.rating}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    Težina: {course.level}
                  </Badge>
                  {course.duration !== "N/A" && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.duration}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </InfiniteSlider>
      </div>
    </motion.div>
  );
}
