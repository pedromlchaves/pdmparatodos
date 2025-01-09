import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { compare } from "bcryptjs"

import { sign } from "jsonwebtoken"; // Use this to create a token for credentials login

const prisma = new PrismaClient()

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      access_token?: string;
    };
  }
}

const checkEnvironmentVariables = () => {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (!process.env.NEXTAUTH_URL) {
    console.warn('NEXTAUTH_URL is not set. Using default: http://localhost:3000')
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
  }
}

checkEnvironmentVariables()


export const authOptions: NextAuthOptions = {
  debug: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,  
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Add user ID
        token.user_id = user.id;
  
        // Handle credentials login (custom token)
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
          throw new Error('NEXTAUTH_SECRET is not defined');
        }
        const customToken = sign(
          { id: user.id, email: user.email },
          secret,
          { expiresIn: "10s" }
        );
  
        token.access_token = customToken
      }
  
      return token;
    },
  
    async session({ session, token }) {
      // Add user ID to the session
      if (session.user && token.user_id) {
        session.user.id = token.user_id as string;
      }
  
      // Add access token directly from JWT
      session.user.access_token = token.access_token as string;
      return session;
    },
  },
}

console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)

