import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/prisma"
import crypto from "crypto"
import { hashDeviceToken } from "@/lib/two-factor"

const TRUST_DAYS = 30

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    })

    if (!user?.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA nije omogućena za ovaj račun." },
        { status: 400 }
      )
    }

    const token = crypto.randomBytes(32).toString("hex")
    const deviceHash = hashDeviceToken(token)
    const expiresAt = new Date(Date.now() + TRUST_DAYS * 24 * 60 * 60 * 1000)

    await prisma.trustedDevice.create({
      data: {
        userId: session.user.id,
        deviceIdHash: deviceHash,
        userAgent: request.headers.get("user-agent") || undefined,
        expiresAt,
        lastUsedAt: new Date(),
      },
    })

    const response = NextResponse.json(
      { message: "Uređaj je zapamćen." },
      { status: 200 }
    )

    response.cookies.set({
      name: "trusted_device",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TRUST_DAYS * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("2FA trust device error:", error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom spremanja uređaja." },
      { status: 500 }
    )
  }
}
