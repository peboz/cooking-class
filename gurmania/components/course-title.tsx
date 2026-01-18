import Link from 'next/link'

interface Course {
  title: string
  instructor: string
  instructorId: string
  level: string
  duration?: string
  rating?: string
}

export function CourseTitle( {title, instructor, instructorId, level, duration, rating} : Course ){
  return (
    <section className="bg-gradient-to-b from-orange-100 to-orange-50 dark:from-gray-900 dark:to-gray-950 py-8 md:py-12 px-4 md:px-8 border-b border-orange-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-2 md:mb-3">{title}</h1>
        <Link href={`/app/profile/instructor/${instructorId}`}>
          <h2 className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 text-center mb-6 md:mb-8 font-light hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer">{instructor}</h2>
        </Link>
        
        {/* Mobile: Stack vertically with cards */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-3 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Nivo</span>
            <span className="text-base font-semibold text-gray-900 dark:text-white">{level}</span>
          </div>
          {duration && (
            <div className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-3 shadow-sm">
              <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Trajanje</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">{duration}</span>
            </div>
          )}
          {rating && (
            <div className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-3 shadow-sm">
              <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Ocjena</span>
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{rating}</span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex justify-between items-center text-gray-700 dark:text-gray-300 font-medium px-8">
          <div className="flex items-center gap-2">
            <span className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Nivo</span>
            <span className="text-lg">{level}</span>
          </div>
          {duration && (
            <div className="flex items-center gap-2">
              <span className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Trajanje</span>
              <span className="text-lg">{duration}</span>
            </div>
          )}
          {rating && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-lg font-semibold">{rating}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
