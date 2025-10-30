import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        <div>
            <Button asChild size="lg">
              <Link href="/auth/register">Registriraj se</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">Prijavi se</Link>
            </Button>
          </div>
      </Card>
    </div>
  )
}
