"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Instructor {
  id: string;
  name: string | null;
  image: string | null;
  verified: boolean;
}

interface Course {
  id: string;
  title: string;
  difficulty: string;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  className,
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!value || value.length < 2) {
      setIsOpen(false);
      setInstructors([]);
      setCourses([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Fetch instructors
        const instructorsRes = await fetch(
          `/api/instructors?search=${encodeURIComponent(value)}`
        );
        const instructorsData = await instructorsRes.json();

        // Fetch courses (lightweight)
        const coursesRes = await fetch(
          `/api/courses?search=${encodeURIComponent(value)}&limit=5`
        );
        const coursesData = await coursesRes.json();

        setInstructors(instructorsData.instructors?.slice(0, 5) || []);
        setCourses(coursesData.courses?.slice(0, 5) || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  const handleInstructorClick = (instructorId: string) => {
    setIsOpen(false);
    router.push(`/profile/instructor/${instructorId}`);
  };

  const handleCourseClick = (courseId: string) => {
    setIsOpen(false);
    router.push(`/app/courses/${courseId}`);
  };

  const hasResults = instructors.length > 0 || courses.length > 0;

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <form onSubmit={onSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pretraži tečajeve i instruktore..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
        />
      </form>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Pretraživanje...
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nema rezultata
            </div>
          ) : (
            <div className="space-y-3">
              {instructors.length > 0 && (
                <div>
                  <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                    Instruktori
                  </div>
                  <div className="space-y-1">
                    {instructors.map((instructor) => (
                      <button
                        key={instructor.id}
                        type="button"
                        onClick={() => handleInstructorClick(instructor.id)}
                        className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-accent"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={instructor.image || undefined}
                            alt={instructor.name || "Instruktor"}
                          />
                          <AvatarFallback>
                            {instructor.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "I"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-1 items-center gap-2">
                          <span className="text-sm">
                            {instructor.name || "Nepoznati instruktor"}
                          </span>
                          {instructor.verified && (
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {courses.length > 0 && (
                <div>
                  <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                    Tečajevi
                  </div>
                  <div className="space-y-1">
                    {courses.map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => handleCourseClick(course.id)}
                        className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-accent"
                      >
                        <div className="flex-1">
                          <div className="text-sm">{course.title}</div>
                          {course.difficulty && (
                            <Badge
                              variant="outline"
                              className="mt-1 text-xs"
                            >
                              {course.difficulty === "EASY"
                                ? "Početnik"
                                : course.difficulty === "MEDIUM"
                                ? "Srednji"
                                : "Napredni"}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
