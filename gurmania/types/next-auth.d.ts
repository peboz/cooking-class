import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      isActive?: boolean
      twoFactorEnabled?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    isActive?: boolean
    twoFactorEnabled?: boolean
  }
}

