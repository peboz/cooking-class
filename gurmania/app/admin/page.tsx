export default function AdminDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Dobrodošli u admin panel platforme Gurmania.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Ukupno korisnika</h3>
            <div className="text-2xl font-bold">1,234</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Instruktori</h3>
            <div className="text-2xl font-bold">56</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Tečajevi</h3>
            <div className="text-2xl font-bold">89</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Zahtjevi na čekanju</h3>
            <div className="text-2xl font-bold">12</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Nedavne aktivnosti</h3>
        <p className="text-sm text-muted-foreground">
          Ovdje će biti prikazane nedavne aktivnosti na platformi.
        </p>
      </div>
    </div>
  );
}
