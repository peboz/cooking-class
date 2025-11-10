import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            © {currentYear} Gurmania. Sva prava pridržana.
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Uvjeti korištenja
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Politika privatnosti
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

