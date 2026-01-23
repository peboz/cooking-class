import NextAuth, { CredentialsSignin } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/prisma"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import {
  decryptSecret,
  hashDeviceToken,
  normalizeBackupCode,
  normalizeTwoFactorCode,
  verifyTotp,
} from "@/lib/two-factor"

class TwoFactorRequiredError extends CredentialsSignin {
  code = "TwoFactorRequired"
}

class InvalidTwoFactorCodeError extends CredentialsSignin {
  code = "InvalidTwoFactorCode"
}

class TwoFactorSetupIncompleteError extends CredentialsSignin {
  code = "TwoFactorSetupIncomplete"
}
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        backupCode: { label: "Backup code", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            emailVerified: true,
            isActive: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          return null;
        }

        // Check if user account is active
        if (!user.isActive) {
          throw new Error("AccountDeactivated");
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        if (user.twoFactorEnabled) {
          const cookieHeader = request?.headers?.get("cookie") || ""
          const trustedToken = cookieHeader
            .split(";")
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith("trusted_device="))
            ?.split("=")[1]

          let isTrustedDevice = false

          if (trustedToken) {
            const deviceHash = hashDeviceToken(trustedToken)
            const trustedDevice = await prisma.trustedDevice.findFirst({
              where: {
                userId: user.id,
                deviceIdHash: deviceHash,
                expiresAt: { gt: new Date() },
              },
            })

            if (trustedDevice) {
              isTrustedDevice = true
              await prisma.trustedDevice.update({
                where: { id: trustedDevice.id },
                data: { lastUsedAt: new Date() },
              })
            }
          }

          if (!isTrustedDevice) {
            const otp = normalizeTwoFactorCode((credentials.otp as string) || "")
            const backupCode = normalizeBackupCode((credentials.backupCode as string) || "")

            if (!otp && !backupCode) {
              throw new TwoFactorRequiredError()
            }

            if (otp) {
              if (!user.twoFactorSecret) {
                throw new TwoFactorSetupIncompleteError()
              }

              const secret = decryptSecret(user.twoFactorSecret)
              const valid = verifyTotp(otp, secret)
              if (!valid) {
                throw new InvalidTwoFactorCodeError()
              }
            } else if (backupCode) {
              const availableCodes = await prisma.backupCode.findMany({
                where: { userId: user.id, usedAt: null },
              })

              let matched = false
              for (const code of availableCodes) {
                const isMatch = await bcrypt.compare(backupCode, code.codeHash)
                if (isMatch) {
                  matched = true
                  await prisma.backupCode.update({
                    where: { id: code.id },
                    data: { usedAt: new Date() },
                  })
                  break
                }
              }

              if (!matched) {
                throw new InvalidTwoFactorCodeError()
              }
            }
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user is active (for both OAuth and credentials)
      if (user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isActive: true, twoFactorEnabled: true },
        });

        // Block inactive users from signing in
        if (dbUser && !dbUser.isActive) {
          return false;
        }

        if (account && account.provider !== "credentials" && dbUser?.twoFactorEnabled) {
          return "/auth/login?error=TwoFactorRequired";
        }
      }

      // For OAuth providers, allow sign-in and let PrismaAdapter handle user creation
      // Email verification will be handled in the jwt callback
      if (account && account.provider !== "credentials") {
        return true;
      }

      // For credentials provider, validation is already done in authorize()
      return true;
    },
    async jwt({ token, user, account, profile, trigger }) {
      // When user signs in with OAuth, verify their email automatically
      if (account && account.provider !== "credentials" && user?.email) {
        // Find the user in database (now it should exist, created by PrismaAdapter)
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (dbUser && !dbUser.emailVerified) {
          // Automatically verify email for OAuth users
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { emailVerified: new Date() },
          });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        
        // Fetch fresh user data from database (including updated image)
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
            twoFactorEnabled: true,
          },
        });

        if (dbUser) {
          session.user.name = dbUser.name;
          session.user.email = dbUser.email!;
          session.user.image = dbUser.image;
          session.user.role = dbUser.role;
          session.user.isActive = dbUser.isActive;
          session.user.twoFactorEnabled = dbUser.twoFactorEnabled;
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
        } catch (error) {
          console.error("Failed to update lastLoginAt:", error)
        }
      }
    },
    async linkAccount({ user, account, profile }) {
      // When an account is linked, verify the email automatically for OAuth providers
      if (account.provider !== "credentials" && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (dbUser && !dbUser.emailVerified) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { emailVerified: new Date() },
          });
        }
      }
    },
  },
  session: {
    strategy: "jwt",
  },
})