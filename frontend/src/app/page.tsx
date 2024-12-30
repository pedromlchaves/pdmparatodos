import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import MapComponent from "@/components/MapComponent"
import { authOptions } from "@/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <MapComponent />
}

