import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import { InfiniteSlider } from "@/components/motion-primitives/infinite-slider";
import { HeroSlider } from "@/components/hero-slider";
import {
  AnimatedNav,
  AnimatedSection,
  AnimatedItem,
  AnimatedViewSection,
} from "@/components/animated-sections";
import { prisma } from "@/prisma";
import { formatCourseForLanding, ensureMinimumCourses, formatInstructorForLanding } from "@/lib/course-helpers";

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

// Revalidate page every 5 minutes
export const revalidate = 300;

// Fetch courses from database
async function getLandingPageCourses() {
  const courses = await prisma.course.findMany({
    where: {
      published: true,
      deletedAt: null,
      instructor: {
        isActive: true,
        instructorProfile: {
          verified: true,
        },
      },
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
        },
      },
      modules: {
        include: {
          lessons: {
            where: { published: true },
            select: {
              durationMin: true,
            },
          },
        },
      },
      media: {
        where: { type: "IMAGE" },
        take: 1,
      },
      reviews: {
        select: { rating: true },
      },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return courses.map((course) => formatCourseForLanding(course));
}

// Fetch instructors from database
async function getLandingPageInstructors() {
  const instructors = await prisma.user.findMany({
    where: {
      role: "INSTRUCTOR",
      isActive: true,
      instructorProfile: {
        verified: true,
      },
    },
    include: {
      instructorProfile: {
        select: {
          specializations: true,
        },
      },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return instructors.map(formatInstructorForLanding);
}

export default async function Home() {
  // Fetch courses and instructors from database
  const allCourses = await getLandingPageCourses();
  const instructors = await getLandingPageInstructors();
  
  // Split into two sets and ensure minimum 5 courses per slider
  const coursesSet1 = ensureMinimumCourses(allCourses.slice(0, 5), 5);
  const coursesSet2 = ensureMinimumCourses(allCourses.slice(5, 10), 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <AnimatedNav className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold">Gurmania</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost">Prijava</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-orange-600 hover:bg-orange-700">Registracija</Button>
            </Link>
          </div>
        </div>
      </AnimatedNav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection className="space-y-6" variants="stagger">
            <AnimatedItem>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                Pridruži se zajednici kuhara amatera
              </Badge>
            </AnimatedItem>
            <AnimatedItem>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Nauči <span className="text-orange-600">kulinarske vještine</span> od stručnih
                instruktora
              </h1>
            </AnimatedItem>
            <AnimatedItem>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Platforma koja povezuje instruktore kuhanja s polaznicima kroz video-lekcije i
                live radionice. Učite prema vlastitom rasporedu, od početnika do chefa.
              </p>
            </AnimatedItem>
            <AnimatedItem>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8">
                    Počni učiti
                  </Button>
                </Link>
              </div>
            </AnimatedItem>
            <AnimatedItem>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Video lekcija</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Instruktora</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <div className="text-3xl font-bold">4.9/5</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Prosječna ocjena</div>
                </div>
              </div>
            </AnimatedItem>
          </AnimatedSection>
          
          {/* Two Vertical Course Sliders */}
          <HeroSlider coursesSet1={coursesSet1} coursesSet2={coursesSet2} />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <AnimatedViewSection className="text-center mb-16" variants="stagger">
          <AnimatedItem>
            <h2 className="text-4xl font-bold mb-4">
              Započni svoje kulinarsko putovanje u 3 koraka
            </h2>
          </AnimatedItem>
        </AnimatedViewSection>
        <AnimatedViewSection className="grid md:grid-cols-3 gap-8" variants="stagger">
          {[
            {
              step: 1,
              title: "Odaberi tečaj",
              description:
                "Izaberi tečajeve prema razini vještine, prehrambenim preferencijama i omiljenim kuhinjama",
            },
            {
              step: 2,
              title: "Uči i vježbaj",
              description:
                "Prati video lekcije, sudjeluj u live radionicama i vježbaj s detaljnim receptima",
            },
            {
              step: 3,
              title: "Certificiraj se",
              description:
                "Dovršavaj kvizove, osvajaj certifikate i postani chef svoje kuhinje",
            },
          ].map((item, index) => (
            <AnimatedItem key={index} className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
            </AnimatedItem>
          ))}
        </AnimatedViewSection>
      </section>

      {/* Instructors Infinite Slider */}
      <section className="py-20 overflow-hidden">
        <AnimatedViewSection className="text-center mb-8 container mx-auto px-4" variants="stagger">
          <AnimatedItem>
            <Badge className="mb-4">Naši instruktori</Badge>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl font-bold mb-4">Uči od verificiranih stručnjaka</h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Naši verificirani instruktori donose godine profesionalnog iskustva i strast za
              podučavanje
            </p>
          </AnimatedItem>
        </AnimatedViewSection>

        <AnimatedSection variants="fade" className="relative">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-orange-50 to-transparent dark:from-gray-900 dark:to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-50 to-transparent dark:from-gray-900 dark:to-transparent z-10 pointer-events-none" />

          <InfiniteSlider gap={24} speed={40}>
            {instructors.map((instructor, index) => (
              <Card
                key={index}
                className="w-[280px] rounded-2xl hover:shadow-lg transition-shadow bg-white dark:bg-gray-950"
              >
                <CardHeader className="text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarFallback className="bg-orange-200 text-2xl">
                      {instructor.image}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{instructor.name}</CardTitle>
                  <CardDescription>{instructor.specialty}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </InfiniteSlider>
        </AnimatedSection>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <AnimatedSection variants="scale">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 border-2 rounded-3xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Spreman/a za kuhanje?</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Pridruži se tisućama polaznika koji uče kuhati od najboljih instruktora.
                Registriraj se danas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="rounded-xl text-lg px-8">
                    Prijavi se
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700 rounded-xl text-lg px-8">
                    Registriraj se
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-950">
        <AnimatedSection variants="fade" className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a
                href="/auth/login"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                Prijavi se
              </a>
              <a
                href="/auth/register"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                Registriraj se
              </a>
              <span className="text-gray-400">|</span>
              <Link
                href="/privacy-policy"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                Politika privatnosti
              </Link>
              <Link
                href="/terms-of-service"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                Uvjeti korištenja
              </Link>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} Gurmania. Sva prava pridržana. Made with ❤️ at FER in
                Zagreb.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </footer>
    </div>
  );
}
