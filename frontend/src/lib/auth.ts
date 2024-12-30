import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return true
      }
      return false
    },
  },
}

console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)

