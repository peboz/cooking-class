import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseSection } from "@/components/course-section"
import { CourseTitle } from "@/components/course-title"
import { Sparkles } from "lucide-react"

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
  }
];

const coursesSet2 = [
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

export default async function AppPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900 overflow-hidden">
      {/* Navigation */}
      <Navbar user={session.user} />
    
      <main className="flex-1 overflow-auto">
        <CourseTitle 
        title="Azijska kuhinja"
        instructor="Chef Nina Tomić"
        level="Početnik"
        duration="5 sati"
        rating="4.8"
        />

        <div className="p-6">
      {/* Section: Japan... */}
        <CourseSection 
          title="Japanske delicije" 
          icon={Sparkles} 
          courses={coursesSet1} 
        />

      {/* Section: Kina... */}
        <CourseSection 
          title="Kineska kuhinja" 
          icon={Sparkles} 
          courses={coursesSet2} 
        />
      
      {/* Section: Koreja... */}
        <CourseSection 
          title="Korejski specijaliteti" 
          icon={Sparkles} 
          courses={coursesSet1} 
        />
        </div>
      
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
