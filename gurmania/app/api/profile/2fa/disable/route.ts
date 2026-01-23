import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 })
    }

    const body = await request.json()
    const password = body?.password || ""

    if (!password) {
      return NextResponse.json({ error: "Unesite lozinku za potvrdu." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user?.password) {
      return NextResponse.json(
        { error: "Za isključivanje 2FA morate imati postavljenu lozinku." },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: "Lozinka nije ispravna." }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.backupCode.deleteMany({
        where: { userId: session.user.id },
      }),
      prisma.trustedDevice.deleteMany({
        where: { userId: session.user.id },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorConfirmedAt: null,
        },
      }),
    ])

    return NextResponse.json(
      { message: "2FA je isključena." },
      { status: 200 }
    )
  } catch (error) {
    console.error("2FA disable error:", error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom isključivanja 2FA." },
      { status: 500 }
    )
  }
}
