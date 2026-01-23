import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/prisma"
import bcrypt from "bcryptjs"
import {
  decryptSecret,
  generateBackupCodes,
  normalizeTwoFactorCode,
  verifyTotp,
} from "@/lib/two-factor"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 })
    }

    const body = await request.json()
    const code = normalizeTwoFactorCode(String(body?.code || ""))

    if (!code) {
      return NextResponse.json({ error: "Unesite 6-znamenkasti kod." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })

    if (!user?.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA nije inicijalizirana. Pokrenite postavljanje iznova." },
        { status: 400 }
      )
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA je već omogućena." },
        { status: 400 }
      )
    }

    const secret = decryptSecret(user.twoFactorSecret)
    const isValid = verifyTotp(code, secret)

    if (!isValid) {
      return NextResponse.json({ error: "Neispravan kod. Pokušajte ponovno." }, { status: 400 })
    }

    const backupCodes = generateBackupCodes(10)
    const hashedCodes = await Promise.all(
      backupCodes.map(async (code) => ({
        codeHash: await bcrypt.hash(code.replace(/-/g, ""), 10),
      }))
    )

    await prisma.$transaction([
      prisma.backupCode.deleteMany({
        where: { userId: session.user.id },
      }),
      prisma.backupCode.createMany({
        data: hashedCodes.map((code) => ({
          userId: session.user.id,
          codeHash: code.codeHash,
        })),
      }),
      prisma.trustedDevice.deleteMany({
        where: { userId: session.user.id },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorConfirmedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json(
      {
        message: "2FA je uspješno omogućena.",
        backupCodes,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("2FA verify error:", error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom potvrde 2FA." },
      { status: 500 }
    )
  }
}
