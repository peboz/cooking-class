import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BookOpen, Sparkles, Video } from "lucide-react"
import { CourseCard } from "@/components/course-card"

const coursesSet1 = [
  {
    title: "Talijanska pasta",
    instructor: "Chef Marija Kovačević",
    level: "Srednji",
    duration: "6 sati",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80"
  },
  {
    title: "Čokoladna torta",
    instructor: "Chef Ivan Horvat",
    level: "Napredni",
    duration: "8 sati",
    rating: "5.0",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80"
  },
  {
    title: "Japanska kuhinja",
    instructor: "Chef Ana Novak",
    level: "Početnik",
    duration: "5 sati",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80"
  },
  {
    title: "Veganski recepti",
    instructor: "Chef Petra Jurić",
    level: "Početnik",
    duration: "4 sati",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80"
  },
  {
    title: "Mediteranske delicije",
    instructor: "Chef Luka Marić",
    level: "Srednji",
    duration: "7 sati",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80"
  }
];

const coursesSet2 = [
  {
    title: "Azijska kuhinja",
    instructor: "Chef Nina Tomić",
    level: "Početnik",
    duration: "5 sati",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80"
  },
  {
    title: "Grill majstor",
    instructor: "Chef Mateo Horvat",
    level: "Napredni",
    duration: "6 sati",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"
  },
  {
    title: "Deserti i kolači",
    instructor: "Chef Sara Perić",
    level: "Srednji",
    duration: "7 sati",
    rating: "5.0",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80"
  },
  {
    title: "Brza i zdrava jela",
    instructor: "Chef Tomislav Babić",
    level: "Početnik",
    duration: "4 sati",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
  },
  {
    title: "Meksička kuhinja",
    instructor: "Chef Ivana Lovrić",
    level: "Srednji",
    duration: "6 sati",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80"
  }
];

const liveWorkshops = [
  {
    title: "Live: Sushi masterclass",
    instructor: "Chef Ana Novak",
    level: "Napredni",
    duration: "3 sata",
    rating: "5.0",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80"
  },
  {
    title: "Live: Grill tehnike",
    instructor: "Chef Mateo Horvat",
    level: "Napredni",
    duration: "2.5 sata",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"
  },
  {
    title: "Live: Veganski recepti",
    instructor: "Chef Petra Josipović",
    level: "Početnik",
    duration: "75 min",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80"
  }
];

export default async function AppPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900 overflow-hidden">
      {/* Navigation */}
      <Navbar user={session.user} />
    
        <main className="flex-1 p-6 overflow-auto">
          {/* Section: Moglo bi Vam se svidjeti... */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="!w-[1.625rem] !h-[1.625rem]" />
              Moglo bi Vam se svidjeti...
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {coursesSet1.map((course) => (
                <CourseCard key={course.title + '-' + course.instructor} course={course} />
              ))}
            </div>
          </section>

          {/* Section: Vaši tečajevi */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="!w-[1.625rem] !h-[1.625rem]" />
              Vaši tečajevi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {coursesSet2.map((course) => (
                <CourseCard key={course.title + '-' + course.instructor} course={course} />
              ))}
            </div>
          </section>

          {/* Section: Live Radionice */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Video className="!w-6 !h-6" />
              Live Radionice
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {liveWorkshops.map((course) => (
                <CourseCard key={course.title + '-' + course.instructor} course={course} />
              ))}
            </div>
          </section>

          {/* Footer */}
          <Footer />
        </main>
    </div>
  );
}
