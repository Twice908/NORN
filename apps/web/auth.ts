import NextAuth, { type NextAuthResult } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@norn/db'

const authConfig: NextAuthResult = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email).trim().toLowerCase() },
        })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(String(credentials.password), user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name ?? undefined }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.uid = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (session.user && token.uid) session.user.id = token.uid as string
      return session
    },
  },
})

export const handlers = authConfig.handlers
export const auth: NextAuthResult['auth'] = authConfig.auth
export const signIn: NextAuthResult['signIn'] = authConfig.signIn
export const signOut: NextAuthResult['signOut'] = authConfig.signOut

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

