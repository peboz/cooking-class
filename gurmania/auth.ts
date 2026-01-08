import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/prisma"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
 
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          return null;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          return null;
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
          },
        });

        if (dbUser) {
          session.user.name = dbUser.name;
          session.user.email = dbUser.email!;
          session.user.image = dbUser.image;
          session.user.role = dbUser.role;
        }
      }
      return session;
    },
  },
  events: {
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