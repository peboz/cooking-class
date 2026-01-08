interface Course {
  title: string
  instructor: string
  level: string
  duration: string
  rating: string
}

export function CourseTitle( {title, instructor, level, duration, rating} : Course ){
  return (
    <section className="bg-gradient-to-b from-orange-100 to-orange-50 dark:from-gray-900 dark:to-gray-950 py-12 px-8 border-b border-orange-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-3">{title}</h1>
        <h2 className="text-2xl text-gray-600 dark:text-gray-300 text-center mb-8 font-light">{instructor}</h2>
        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 font-medium px-8">
          <div className="flex items-center gap-2">
            <span className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Nivo</span>
            <span className="text-lg">{level}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Trajanje</span>
            <span className="text-lg">{duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <span className="text-lg font-semibold">{rating}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
