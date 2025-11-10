import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default async function AppPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={session.user} />
      <main className="flex-1">
        {/* Main content will go here */}
      </main>
      <Footer />
    </div>
  )
}

