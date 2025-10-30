"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  let errorMessage = "Došlo je do greške tijekom autentikacije"
  let errorDescription = "Molimo pokušajte ponovno ili kontaktirajte podršku ako problem i dalje postoji."

  if (error === "Configuration" || error === "CredentialsSignin") {
    errorMessage = "Prijava nije uspjela"
    errorDescription = "Neispravni podaci. Molimo provjerite svoj email i lozinku te pokušajte ponovno."
  } else if (error === "AccessDenied") {
    errorMessage = "Pristup odbijen"
    errorDescription = "Nemate dozvolu za prijavu."
  } else if (error === "Verification") {
    errorMessage = "Verifikacija nije uspjela"
    errorDescription = "Token za verifikaciju je istekao ili je već iskorišten."
  } else if (error === "OAuthSignin") {
    errorMessage = "OAuth prijava nije uspjela"
    errorDescription = "Došlo je do problema prilikom prijave s vašim OAuth providerom. Molimo pokušajte ponovno."
  } else if (error === "OAuthCallback") {
    errorMessage = "OAuth callback greška"
    errorDescription = "Došlo je do problema prilikom dovršavanja OAuth prijave. Molimo pokušajte ponovno."
  } else if (error === "OAuthCreateAccount") {
    errorMessage = "Nije moguće kreirati račun"
    errorDescription = "Došlo je do problema prilikom kreiranja vašeg računa s OAuth-om. Molimo pokušajte ponovno."
  } else if (error === "EmailCreateAccount") {
    errorMessage = "Nije moguće kreirati račun"
    errorDescription = "Došlo je do problema prilikom kreiranja vašeg računa. Molimo pokušajte ponovno."
  } else if (error === "Callback") {
    errorMessage = "Greška autentikacijskog callback-a"
    errorDescription = "Došlo je do problema prilikom dovršavanja autentikacije. Molimo pokušajte ponovno."
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Greška autentikacije</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {errorDescription}
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">Natrag na prijavu</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Greška autentikacije</CardTitle>
            <CardDescription>Učitavanje...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}

