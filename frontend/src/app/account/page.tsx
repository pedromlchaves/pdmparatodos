import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import AccountComponent from "@/components/AccountComponent"
import { authOptions } from "@/lib/auth"

export default async function Account() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <AccountComponent />
}

