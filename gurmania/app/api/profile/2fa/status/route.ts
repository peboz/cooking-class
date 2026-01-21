import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        password: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 })
    }

    const backupCodesRemaining = await prisma.backupCode.count({
      where: { userId: session.user.id, usedAt: null },
    })

    return NextResponse.json(
      {
        enabled: user.twoFactorEnabled,
        hasSecret: !!user.twoFactorSecret,
        hasPassword: !!user.password,
        backupCodesRemaining,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("2FA status error:", error)
    return NextResponse.json({ error: "Došlo je do greške" }, { status: 500 })
  }
}
