import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/prisma"
import { generatePasswordResetToken } from "@/lib/tokens"
import { sendSetPasswordEmail } from "@/lib/email"

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, email: true },
    })

    if (!user?.email) {
      return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 })
    }

    if (user.password) {
      return NextResponse.json(
        { error: "Lozinka je već postavljena. Koristite reset lozinke." },
        { status: 400 }
      )
    }

    const token = await generatePasswordResetToken(user.email)
    await sendSetPasswordEmail(user.email, token)

    return NextResponse.json(
      { message: "Poslali smo vam link za postavljanje lozinke." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Request set password error:", error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom slanja linka." },
      { status: 500 }
    )
  }
}
