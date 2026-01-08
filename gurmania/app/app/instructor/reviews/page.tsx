export default function InstructorReviewsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recenzije</h1>
        <p className="text-muted-foreground">
          Pregledajte recenzije polaznika i povratne informacije.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Ovdje će biti prikazane sve recenzije vaših tečajeva i radionica.
        </p>
      </div>
    </div>
  );
}
