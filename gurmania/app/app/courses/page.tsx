'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CourseCard } from '@/components/course-card';
import { InstructorCard } from '@/components/instructor-card';
import { SearchAutocomplete } from '@/components/search-autocomplete';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DIFFICULTY_LEVELS, CUISINE_TYPES, ALLERGENS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

interface Course {
  id: string;
  title: string;
  instructor: string;
  level: string;
  duration?: string;
  rating?: number;
  lessonCount?: number;
  image: string;
}

interface Instructor {
  id: string;
  name: string | null;
  image: string | null;
  verified: boolean;
}

function CourseBrowseContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [isInstructor, setIsInstructor] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchCourses();
    if (search) {
      fetchInstructors();
    } else {
      setInstructors([]);
    }
    fetchUserProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, selectedDifficulties, selectedCuisines, selectedAllergens, offset]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setIsInstructor(data.role === 'INSTRUCTOR' || data.role === 'ADMIN' || data.instructorProfile?.verified);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (sortBy) params.append('sortBy', sortBy);
      if (selectedDifficulties.length > 0) {
        params.append('difficulties', selectedDifficulties.join(','));
      }
      if (selectedCuisines.length > 0) {
        params.append('cuisineTypes', selectedCuisines.join(','));
      }
      if (selectedAllergens.length > 0) {
        params.append('allergens', selectedAllergens.join(','));
      }
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/courses?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      
      // Format courses for display
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedCourses = data.courses.map((course: any) => {
        const difficultyMap: Record<string, string> = {
          'EASY': 'Lako',
          'MEDIUM': 'Srednje',
          'HARD': 'Teško',
        };
        
        const totalDuration = course.totalDuration || 0;
        
        return {
          id: course.id,
          title: course.title,
          instructor: course.instructor?.name || 'Nepoznati instruktor',
          level: difficultyMap[course.difficulty] || course.difficulty,
          duration: totalDuration > 0 ? `${Math.round(totalDuration / 60)} sati` : undefined,
          rating: course.avgRating,
          lessonCount: course.lessonCount,
          image: course.thumbnail,
        };
      });
      
      setCourses(formattedCourses);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    if (!search) {
      setInstructors([]);
      return;
    }

    try {
      setInstructorsLoading(true);
      const params = new URLSearchParams();
      params.append('search', search);

      const response = await fetch(`/api/instructors?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch instructors');
      }

      const data = await response.json();
      setInstructors(data.instructors || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setInstructors([]);
    } finally {
      setInstructorsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchCourses();
    if (search) {
      fetchInstructors();
    }
  };

  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulties(prev => 
      prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
    setOffset(0);
  };

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
    setOffset(0);
  };

  const handleAllergenToggle = (allergen: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
    setOffset(0);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedDifficulties([]);
    setSelectedCuisines([]);
    setSelectedAllergens([]);
    setSortBy('newest');
    setOffset(0);
  };

  const hasFilters = search || selectedDifficulties.length > 0 || selectedCuisines.length > 0 || selectedAllergens.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar user={session?.user} isInstructor={isInstructor} isAdmin={session?.user?.role === 'ADMIN'} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Pregledajte tečajeve</h1>
          <p className="text-muted-foreground">Otkrijte savršen tečaj za svoje kulinarske vještine</p>
        </div>

        {/* Search and filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search bar with autocomplete */}
            <SearchAutocomplete
              value={search}
              onChange={setSearch}
              onSubmit={handleSearchSubmit}
              className="flex-1"
            />

            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setOffset(0); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sortiraj po" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Najnoviji</SelectItem>
                <SelectItem value="popular">Popularni</SelectItem>
                <SelectItem value="rating">Ocjena</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile filter trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="sm:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filteri
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filteri</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <FilterSection 
                    selectedDifficulties={selectedDifficulties}
                    onDifficultyToggle={handleDifficultyToggle}
                    selectedCuisines={selectedCuisines}
                    onCuisineToggle={handleCuisineToggle}
                    selectedAllergens={selectedAllergens}
                    onAllergenToggle={handleAllergenToggle}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active filters display */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Aktivni filteri:</span>
              {search && (
                <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                  Pretraga: {search}
                  <X className="h-3 w-3 ml-1" />
                </Button>
              )}
              {selectedDifficulties.map(diff => (
                <Button key={diff} variant="secondary" size="sm" onClick={() => handleDifficultyToggle(diff)}>
                  {DIFFICULTY_LEVELS.find(d => d.value === diff)?.label}
                  <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {selectedCuisines.map(cuisine => (
                <Button key={cuisine} variant="secondary" size="sm" onClick={() => handleCuisineToggle(cuisine)}>
                  {cuisine}
                  <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {selectedAllergens.map(allergen => (
                <Button key={allergen} variant="secondary" size="sm" onClick={() => handleAllergenToggle(allergen)}>
                  Bez: {allergen}
                  <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Očisti sve
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Desktop filter sidebar */}
          <aside className="hidden sm:block w-64 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              <FilterSection 
                selectedDifficulties={selectedDifficulties}
                onDifficultyToggle={handleDifficultyToggle}
                selectedCuisines={selectedCuisines}
                onCuisineToggle={handleCuisineToggle}
                selectedAllergens={selectedAllergens}
                onAllergenToggle={handleAllergenToggle}
              />
            </div>
          </aside>

          {/* Course grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-[140px] w-full rounded-t-lg" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Prikazano {courses.length} od {total} tečajeva
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                
                {/* Pagination */}
                {total > limit && (
                  <div className="mt-8 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                    >
                      Prethodna
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                    >
                      Sljedeća
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Nema tečajeva koji odgovaraju Vašim filterima</p>
                <Button onClick={clearFilters} className="mt-4">
                  Očisti filtere
                </Button>
              </div>
            )}

            {/* Instructor results section */}
            {search && instructors.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4">Instruktori</h2>
                {instructorsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-20 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      Pronađeno {instructors.length} {instructors.length === 1 ? 'instruktor' : 'instruktora'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {instructors.map((instructor) => (
                        <InstructorCard
                          key={instructor.id}
                          id={instructor.id}
                          name={instructor.name}
                          image={instructor.image}
                          verified={instructor.verified}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface FilterSectionProps {
  selectedDifficulties: string[];
  onDifficultyToggle: (difficulty: string) => void;
  selectedCuisines: string[];
  onCuisineToggle: (cuisine: string) => void;
  selectedAllergens: string[];
  onAllergenToggle: (allergen: string) => void;
}

function FilterSection({ 
  selectedDifficulties, 
  onDifficultyToggle, 
  selectedCuisines,
  onCuisineToggle,
  selectedAllergens,
  onAllergenToggle
}: FilterSectionProps) {
  return (
    <>
      {/* Difficulty filter */}
      <div>
        <h3 className="font-semibold mb-3">Težina</h3>
        <div className="space-y-2">
          {DIFFICULTY_LEVELS.map(level => (
            <div key={level.value} className="flex items-center space-x-2">
              <Checkbox
                id={`difficulty-${level.value}`}
                checked={selectedDifficulties.includes(level.value)}
                onCheckedChange={() => onDifficultyToggle(level.value)}
              />
              <Label htmlFor={`difficulty-${level.value}`} className="cursor-pointer">
                {level.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Cuisine type filter */}
      <div>
        <h3 className="font-semibold mb-3">Vrsta kuhinje</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {CUISINE_TYPES.map(cuisine => (
            <div key={cuisine} className="flex items-center space-x-2">
              <Checkbox
                id={`cuisine-${cuisine}`}
                checked={selectedCuisines.includes(cuisine)}
                onCheckedChange={() => onCuisineToggle(cuisine)}
              />
              <Label htmlFor={`cuisine-${cuisine}`} className="cursor-pointer">
                {cuisine}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Allergen filter */}
      <div>
        <h3 className="font-semibold mb-3">Bez alergena</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {ALLERGENS.map(allergen => (
            <div key={allergen} className="flex items-center space-x-2">
              <Checkbox
                id={`allergen-${allergen}`}
                checked={selectedAllergens.includes(allergen)}
                onCheckedChange={() => onAllergenToggle(allergen)}
              />
              <Label htmlFor={`allergen-${allergen}`} className="cursor-pointer">
                {allergen}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function CourseBrowsePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={undefined} isInstructor={false} isAdmin={false} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Pregledajte tečajeve</h1>
            <p className="text-muted-foreground">Učitavanje...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-[140px] w-full rounded-t-lg" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CourseBrowseContent />
    </Suspense>
  );
}
