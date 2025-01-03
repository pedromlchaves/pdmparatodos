import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import Image from 'next/image'
export function Header() {
  return (
    <header className="bg-gray-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Image
            src="/pdmx.png"
            alt="pdmx"
            width={37.5}
            height={10}
            className="h-auto w-auto mr-2"
          />
          <h1 className="text-2xl font-bold">pdmx</h1>
        </div>
        <Button onClick={() => signOut({ callbackUrl: "/login" })}>Terminar Sessão</Button>
      </div>
    </header>
  )
}

