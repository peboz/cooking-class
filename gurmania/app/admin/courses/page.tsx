"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Eye, EyeOff, Trash2, Edit, Search } from "lucide-react";
import { toast } from "sonner";
import { CUISINE_TYPES, DIFFICULTY_LEVELS } from "@/lib/constants";

type Course = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  cuisineType: string | null;
  published: boolean;
  createdAt: Date;
  instructor: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    isActive: boolean;
  };
  _count: {
    modules: number;
    reviews: number;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    published: "all",
    difficulty: "all",
    cuisineType: "",
  });

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [pagination.page, filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.published !== "all" && { published: filters.published }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.cuisineType && { cuisineType: filters.cuisineType }),
      });

      const response = await fetch(`/api/admin/courses?${params}`);
      if (!response.ok) throw new Error("Greška pri dohvaćanju tečajeva");

      const data = await response.json();
      setCourses(data.courses);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Greška pri učitavanju tečajeva");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !course.published }),
      });

      if (!response.ok) throw new Error("Greška pri promjeni statusa");

      toast.success(
        course.published
          ? "Tečaj uspješno povučen"
          : "Tečaj uspješno objavljen"
      );
      fetchCourses();
    } catch (error) {
      toast.error("Greška pri promjeni statusa");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: true }),
      });

      if (!response.ok) throw new Error("Greška pri brisanju tečaja");

      toast.success("Tečaj uspješno obrisan");
      setDeleteDialogOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error("Greška pri brisanju tečaja");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const level = DIFFICULTY_LEVELS.find(l => l.value === difficulty);
    return level?.label || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "HARD":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("hr-HR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tečajevi</h1>
        <p className="text-muted-foreground">
          Upravljajte svim tečajevima na platformi
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži tečajeve..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.published}
          onValueChange={(value) => {
            setFilters({ ...filters, published: value });
            setPagination({ ...pagination, page: 1 });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status objave" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            <SelectItem value="published">Objavljeni</SelectItem>
            <SelectItem value="unpublished">Skriveni</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.difficulty}
          onValueChange={(value) => {
            setFilters({ ...filters, difficulty: value === "all" ? "" : value });
            setPagination({ ...pagination, page: 1 });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Težina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sve težine</SelectItem>
            {DIFFICULTY_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv</TableHead>
              <TableHead>Instruktor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Težina</TableHead>
              <TableHead>Kuhinja</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Nema pronađenih tečajeva
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{course.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {course._count.modules} modula • {course._count.reviews} recenzija
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={course.instructor.image || undefined} />
                        <AvatarFallback>
                          {course.instructor.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {course.instructor.name || "Bez imena"}
                        </div>
                        {!course.instructor.isActive && (
                          <div className="text-xs text-red-600">Neaktivan</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {course.published ? (
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        <Eye className="h-3 w-3 mr-1" />
                        Objavljen
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-500 text-gray-700">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Skriven
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {getDifficultyLabel(course.difficulty)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.cuisineType || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(course.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/app/instructor/courses/${course.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Uredi
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleTogglePublish(course)}
                          disabled={actionLoading}
                        >
                          {course.published ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Povuci objavu
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Objavi
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCourse(course);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Obriši
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Prikazano {courses.length} od {pagination.total} tečajeva
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1 || loading}
          >
            Prethodna
          </Button>
          <Button
            variant="outline"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            Sljedeća
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Brisanje tečaja</AlertDialogTitle>
            <AlertDialogDescription>
              Jeste li sigurni da želite obrisati tečaj{" "}
              <strong>{selectedCourse?.title}</strong>?
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                <strong>Napomena:</strong> Tečaj će biti arhiviran i neće biti vidljiv 
                polaznicima. Ova akcija se može poništiti.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Odustani</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Brišem..." : "Obriši"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
