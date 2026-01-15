export default function InstructorDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Dobrodošli u instruktorski panel platforme Gurmania.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Tečajevi</h3>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Radionice</h3>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Polaznici</h3>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Prosječna ocjena</h3>
            <div className="text-2xl font-bold">-</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Nedavna aktivnost</h3>
        <p className="text-sm text-muted-foreground">
          Ovdje će biti prikazane nedavne aktivnosti.
        </p>
      </div>
    </div>
  );
}
