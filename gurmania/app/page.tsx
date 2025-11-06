"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import  Link  from "next/link";
import { 
  ChefHat,
  Clock,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { InfiniteSlider } from "@/components/motion-primitives/infinite-slider";
import Image from "next/image";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Dummy courses data - Set 1
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
    title: "Francuska patisserie",
    instructor: "Chef Ivan Horvat",
    level: "Napredni",
    duration: "8 sati",
    rating: "5.0",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80"
  },
  {
    title: "Sushi i japanska kuhinja",
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

// Dummy courses data - Set 2
const coursesSet2 = [
  {
    title: "Azijska street food kuhinja",
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

// Instructors data
const instructors = [
  { name: "Marija Kovačević", specialty: "Talijanska kuhinja", image: "MK" },
  { name: "Ivan Horvat", specialty: "Francuska patisserie", image: "IH" },
  { name: "Ana Novak", specialty: "Japanska kuhinja", image: "AN" },
  { name: "Petra Jurić", specialty: "Veganska kuhinja", image: "PJ" },
  { name: "Luka Marić", specialty: "Mediteranska", image: "LM" },
  { name: "Nina Tomić", specialty: "Slastičarstvo", image: "NT" },
  { name: "Mateo Horvat", specialty: "Grill majstor", image: "MH" },
  { name: "Sara Perić", specialty: "Zdrava prehrana", image: "SP" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold">Gurmania</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"><Button variant="ghost">Prijava</Button></Link>
            <Link href="/auth/register"><Button className="bg-orange-600 hover:bg-orange-700">Registracija</Button></Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="space-y-6"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                Pridruži se zajednici kuhara amatera
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl font-bold leading-tight">
              Nauči <span className="text-orange-600">kulinarske vještine</span> od stručnih instruktora
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600 dark:text-gray-400">
              Platforma koja povezuje instruktore kuhanja s polaznicima kroz video-lekcije i live radionice. Učite prema vlastitom rasporedu, od početnika do chefa.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8">
                Počni učiti
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp} className="flex items-center gap-8 pt-4">
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
            </motion.div>
          </motion.div>
          
          {/* Two Vertical Course Sliders */}
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
                  <Card key={index} className="w-full rounded-2xl overflow-hidden border-2 hover:border-orange-200 transition-colors p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        className="object-cover"
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
                        <div className="flex items-center gap-1 text-amber-500 ml-2 flex-shrink-0">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span className="text-xs font-semibold">{course.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{course.level}</Badge>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </Badge>
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
                  <Card key={index} className="w-full rounded-2xl overflow-hidden border-2 hover:border-orange-200 transition-colors p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        className="object-cover"
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
                        <div className="flex items-center gap-1 text-amber-500 ml-2 flex-shrink-0">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span className="text-xs font-semibold">{course.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{course.level}</Badge>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </InfiniteSlider>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <motion.div 
          className="text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {/*<motion.div variants={fadeInUp}>
            <Badge className="mb-4">Jednostavan proces</Badge>
          </motion.div>*/}
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-4">
            Započni svoje kulinarsko putovanje u 3 koraka
          </motion.h2>
        </motion.div>
        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {[
            {
              step: 1,
              title: "Odaberi tečaj",
              description: "Izaberi tečajeve prema razini vještine, prehrambenim preferencijama i omiljenim kuhinjama"
            },
            {
              step: 2,
              title: "Uči i vježbaj",
              description: "Prati video lekcije, sudjeluj u live radionicama i vježbaj s detaljnim receptima"
            },
            {
              step: 3,
              title: "Certificiraj se",
              description: "Dovršavaj kvizove, osvajaj certifikate i postani chef svoje kuhinje"
            }
          ].map((item, index) => (
            <motion.div key={index} variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Instructors Infinite Slider */}
      <section className="py-20 overflow-hidden">
        <motion.div 
          className="text-center mb-8 container mx-auto px-4"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Badge className="mb-4">Naši instruktori</Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-4">
            Uči od verificiranih stručnjaka
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Naši verificirani instruktori donose godine profesionalnog iskustva i strast za podučavanje
          </motion.p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-orange-50 to-transparent dark:from-gray-900 dark:to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-50 to-transparent dark:from-gray-900 dark:to-transparent z-10 pointer-events-none" />
          
          <InfiniteSlider gap={24} speed={40}>
            {instructors.map((instructor, index) => (
              <Card key={index} className="w-[280px] rounded-2xl hover:shadow-lg transition-shadow bg-white dark:bg-gray-950">
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
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 border-2 rounded-3xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Spreman/a za kuhanje?</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Pridruži se tisućama polaznika koji uče kuhati od najboljih instruktora. Registriraj se danas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" variant="outline" className="rounded-xl text-lg px-8">
                  Prijavi se
                </Button>
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 rounded-xl text-lg px-8">
                  Registriraj se
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-950">
        <motion.div 
          className="container mx-auto px-4 py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="/auth/login" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors">
                Prijavi se
              </a>
              <a href="/auth/register" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors">
                Registriraj se
              </a>
              <span className="text-gray-400">|</span>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors">
                Privatnost
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors">
                Uvjeti korištenja
              </a>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} Gurmania. Sva prava pridržana. Made with ❤️ at FER in Zagreb.
              </p>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
