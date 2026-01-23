"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, CheckCircle, XCircle, Clock, MessageSquare, Star } from "lucide-react";

interface ReviewUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface ReviewCourse {
  id: string;
  title: string;
}

interface ReviewLesson {
  id: string;
  title: string;
  module: {
    course: ReviewCourse;
  };
}

interface ReviewInstructor {
  id: string;
  name: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  targetType: "COURSE" | "LESSON" | "INSTRUCTOR";
  createdAt: string;
  user: ReviewUser;
  course: ReviewCourse | null;
  lesson: ReviewLesson | null;
  instructor: ReviewInstructor | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "/api/admin/reviews" : `/api/admin/reviews?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: Review["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Na čekanju
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Odobreno
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Odbijeno
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTargetLabel = (review: Review) => {
    if (review.targetType === "COURSE") return "Tečaj";
    if (review.targetType === "LESSON") return "Lekcija";
    return "Instruktor";
  };

  const getTargetTitle = (review: Review) => {
    if (review.course) return review.course.title;
    if (review.lesson) return review.lesson.title;
    if (review.instructor) return review.instructor.name || "Instruktor";
    return "Nepoznato";
  };

  const getTargetLink = (review: Review) => {
    if (review.course) return `/app/courses/${review.course.id}`;
    if (review.lesson) return `/app/courses/${review.lesson.module.course.id}`;
    if (review.instructor) return `/app/profile/instructor/${review.instructor.id}`;
    return "#";
  };

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews;
    const query = searchQuery.toLowerCase();
    return reviews.filter((review) => {
      const targetTitle = getTargetTitle(review).toLowerCase();
      return (
        review.comment?.toLowerCase().includes(query) ||
        review.user.name?.toLowerCase().includes(query) ||
        review.user.email.toLowerCase().includes(query) ||
        targetTitle.includes(query)
      );
    });
  }, [reviews, searchQuery]);

  const pendingCount = reviews.filter((review) => review.status === "PENDING").length;

  const handleAction = (review: Review, actionType: "APPROVE" | "REJECT") => {
    setSelectedReview(review);
    setAction(actionType);
    setActionDialogOpen(true);
  };

  const submitAction = async () => {
    if (!selectedReview || !action) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        }),
      });

      if (response.ok) {
        setActionDialogOpen(false);
        await loadReviews();
      } else {
        const data = await response.json();
        alert(data.error || "Došlo je do greške");
      }
    } catch (error) {
      console.error("Error processing review:", error);
      alert("Došlo je do greške");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderacija recenzija</h1>
        <p className="text-muted-foreground">
          Odobrite ili odbijte recenzije tečajeva i instruktora.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Svi
          </Button>
          <Button
            variant={filter === "PENDING" ? "default" : "outline"}
            onClick={() => setFilter("PENDING")}
            className="gap-2"
          >
            Na čekanju
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === "APPROVED" ? "default" : "outline"}
            onClick={() => setFilter("APPROVED")}
          >
            Odobrene
          </Button>
          <Button
            variant={filter === "REJECTED" ? "default" : "outline"}
            onClick={() => setFilter("REJECTED")}
          >
            Odbijene
          </Button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži recenzije, korisnike, tečajeve..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
      ) : filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Nema recenzija</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Pokušajte s drugim pojmom za pretraživanje"
                : "Recenzije će se pojaviti ovdje"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.user.image || undefined} />
                      <AvatarFallback>{getUserInitials(review.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {review.user.name || "Nepoznat korisnik"}
                        </span>
                        <span className="text-xs text-muted-foreground">{review.user.email}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="outline">{getTargetLabel(review)}</Badge>
                        <Link href={getTargetLink(review)} className="underline">
                          {getTargetTitle(review)}
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(review.status)}
                    <div className="flex items-center gap-1 text-sm">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
                {review.photoUrl && (
                  <img
                    src={review.photoUrl}
                    alt="Fotografija recenzije"
                    className="h-32 w-48 rounded-md border object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(review, "APPROVE")}
                    disabled={review.status === "APPROVED"}
                  >
                    Odobri
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(review, "REJECT")}
                    disabled={review.status === "REJECTED"}
                  >
                    Odbij
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "APPROVE" ? "Odobri recenziju" : "Odbij recenziju"}
            </DialogTitle>
            <DialogDescription>
              {action === "APPROVE"
                ? "Recenzija će postati javno vidljiva." 
                : "Recenzija neće biti javno vidljiva."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Odustani
            </Button>
            <Button onClick={submitAction} disabled={processing}>
              {processing ? "Spremam..." : "Potvrdi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
