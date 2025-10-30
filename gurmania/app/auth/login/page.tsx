"use client"

import Link from "next/link"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type LoginStep = "email" | "password" | "oauth-required"
type EmailCheckResult = {
  exists: boolean
  verified?: boolean
  hasPassword?: boolean
  oauthProviders?: string[]
  name?: string
  message?: string
  error?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResult | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data: EmailCheckResult = await response.json()

      if (!response.ok) {
        setError(data.error || "An error occurred")
        setLoading(false)
        return
      }

      setEmailCheckResult(data)

      if (!data.exists) {
        setError("Nema računa s ovom e-mail adresom. Molimo prijavite se prvo.")
        setLoading(false)
        return
      }

      if (!data.verified) {
        setError(data.message || "Molimo verificirajte vašu e-mail adresu")
        setLoading(false)
        return
      }

      // If user has password, proceed to password step
      if (data.hasPassword) {
        setStep("password")
      } else if (data.oauthProviders && data.oauthProviders.length > 0) {
        // OAuth-only account
        setStep("oauth-required")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Map generic errors to user-friendly messages
        if (result.error === "CredentialsSignin" || result.error === "Configuration") {
          setError("Neispravna e-mail adresa ili lozinka. Molimo pokušajte ponovno.")
        } else {
          setError(result.error)
        }
        setLoading(false)
      } else if (result?.ok) {
        router.push("/app")
        router.refresh()
      }
    } catch (err) {
      setError("Došlo je do greške. Molimo pokušajte ponovno.")
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await signIn("google", { callbackUrl: "/app" })
  }

  const handleBackToEmail = () => {
    setStep("email")
    setPassword("")
    setError("")
    setEmailCheckResult(null)
  }

  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {step === "email" && "Dobrodošli natrag"}
            {step === "password" && `Dobrodošli natrag${emailCheckResult?.name ? `, ${emailCheckResult.name.split(' ')[0]}` : ""}`}
            {step === "oauth-required" && "Potrebna prijava"}
          </CardTitle>
          <CardDescription>
            {step === "email" && "Unesite svoj email za nastavak"}
            {step === "password" && "Unesite lozinku za nastavak"}
            {step === "oauth-required" && "Molimo autentificirajte se prvo s vašim OAuth providerom"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" && (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Nastavi s Googleom
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ili nastavi s
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@primjer.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Provjeravam..." : "Nastavi"}
                </Button>
              </form>
            </>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-email">Email</Label>
                <Input
                  id="display-email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Lozinka</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Zaboravili ste lozinku?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Prijava..." : "Prijavi se"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToEmail}
                disabled={loading}
              >
                Koristi drugi email
              </Button>
            </form>
          )}

          {step === "oauth-required" && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm">
                  Ovaj račun je registriran s{" "}
                  {emailCheckResult?.oauthProviders?.map((p, i) => (
                    <span key={p}>
                      <strong>{getProviderName(p)}</strong>
                      {i < (emailCheckResult.oauthProviders?.length || 0) - 1 && ", "}
                    </span>
                  ))}.
                </p>
                <p className="text-sm mt-2">
                  Molimo prijavite se prvo s vašim OAuth providerom. Nakon prijave možete postaviti lozinku za buduće prijave.
                </p>
              </div>

              {emailCheckResult?.oauthProviders?.includes("google") && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Nastavi s Googleom
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToEmail}
                disabled={loading}
              >
                Koristi drugi email
              </Button>
            </div>
          )}

          <div className="text-center text-sm">
            Nemate račun?{" "}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Registrirajte se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

