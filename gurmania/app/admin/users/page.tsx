export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Korisnici</h1>
        <p className="text-muted-foreground">
          Upravljajte svim korisnicima platforme.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Ovdje će biti lista svih korisnika s mogućnostima pretraživanja, filtriranja i upravljanja.
        </p>
      </div>
    </div>
  );
}
