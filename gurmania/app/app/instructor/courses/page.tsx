export default function InstructorCoursesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tečajevi</h1>
        <p className="text-muted-foreground">
          Upravljajte svojim tečajevima i kreirajte nove.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Ovdje će biti lista vaših tečajeva s mogućnostima uređivanja i kreiranja novih.
        </p>
      </div>
    </div>
  );
}
