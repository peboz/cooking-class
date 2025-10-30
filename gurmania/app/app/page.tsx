import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/prisma"
import { generatePasswordResetToken } from "@/lib/tokens"
import { sendSetPasswordEmail } from "@/lib/email"

export default async function AppPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user has password set
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || undefined },
    select: { password: true },
  })

  const hasPassword = !!user?.password

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Dobrodošli u Gurmaniju!</CardTitle>
          <CardDescription>
            Prijavljeni ste kao {session.user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium">Informacije korisnika</p>
            <p className="text-sm text-muted-foreground">Ime: {session.user?.name || "Nije postavljeno"}</p>
            <p className="text-sm text-muted-foreground">Email: {session.user?.email}</p>
          </div>

          {!hasPassword && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Postavite prijavu lozinkom
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Trenutno koristite OAuth. Dodajte lozinku za omogućavanje prijave s emailom i lozinkom.
              </p>
              <form
                action={async () => {
                  "use server"
                  const session = await auth()
                  
                  if (!session?.user?.email) {
                    return
                  }

                  try {
                    const token = await generatePasswordResetToken(session.user.email)
                    await sendSetPasswordEmail(session.user.email, token)
                    // In production, you'd use a toast notification to show success
                  } catch (error) {
                    console.error('Failed to send password setup email:', error)
                  }
                }}
                className="mt-3"
              >
                <Button type="submit" size="sm" variant="outline" className="bg-white dark:bg-slate-900">
                  Zatraži link za postavljanje lozinke
                </Button>
              </form>
            </div>
          )}
          
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Odjavi se
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

