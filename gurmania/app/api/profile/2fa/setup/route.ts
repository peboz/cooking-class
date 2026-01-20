import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/prisma"
import {
  encryptSecret,
  generateBase32Secret,
  generateOtpAuthUrl,
} from "@/lib/two-factor"

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Dvofaktorska autentikacija je već omogućena." },
        { status: 400 }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Za uključivanje 2FA morate imati postavljenu lozinku." },
        { status: 400 }
      )
    }

    const secret = generateBase32Secret()
    const encryptedSecret = encryptSecret(secret)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorConfirmedAt: null,
        twoFactorEnabled: false,
      },
    })

    await prisma.backupCode.deleteMany({
      where: { userId: session.user.id },
    })

    await prisma.trustedDevice.deleteMany({
      where: { userId: session.user.id },
    })

    const otpauthUrl = generateOtpAuthUrl(session.user.email, secret)

    return NextResponse.json(
      {
        secret,
        otpauthUrl,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("2FA setup error:", error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom inicijalizacije 2FA." },
      { status: 500 }
    )
  }
}
