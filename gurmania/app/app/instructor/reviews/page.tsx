"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface Course {
  id: string;
  title: string;
  reviews: Review[];
}

export default function InstructorReviewsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await fetch('/api/instructor/reviews');
      const data = await response.json();
      if (response.ok) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  }

  const totalReviews = courses.reduce((acc, course) => acc + course.reviews.length, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recenzije</h1>
          <p className="text-muted-foreground">
            Pregledajte recenzije polaznika i povratne informacije.
          </p>
        </div>
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recenzije</h1>
        <p className="text-muted-foreground">
          Pregledajte recenzije polaznika i povratne informacije.
        </p>
      </div>

      {totalReviews === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Nema recenzija</h3>
              <p className="text-muted-foreground mt-1">
                Još nema recenzija za vaše tečajeve
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => {
            if (course.reviews.length === 0) return null;

            const avgRating =
              course.reviews.reduce((acc, r) => acc + r.rating, 0) /
              course.reviews.length;

            return (
              <Card key={course.id} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        {renderStars(Math.round(avgRating))}
                        <span>
                          {avgRating.toFixed(1)} ({course.reviews.length}{" "}
                          {course.reviews.length === 1
                            ? "recenzija"
                            : course.reviews.length < 5
                            ? "recenzije"
                            : "recenzija"})
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="divide-y">
                    {course.reviews.map((review) => (
                      <div key={review.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.user.image || undefined} />
                            <AvatarFallback>
                              {getInitials(review.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {review.user.name || "Anonimni korisnik"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(review.createdAt)}
                                </p>
                              </div>
                              {renderStars(review.rating)}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

