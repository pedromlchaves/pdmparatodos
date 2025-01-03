import { authOptions } from "@/lib/auth"
import LoginForm from "@/components/LoginForm"
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import Image from 'next/image'

export default async function LoginPage()  {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center bg-gray-100">
        <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-md">
          <div className="flex justify-center mb-6">
            <Image
              src="/pdmx.png"
              alt="pdmx"
              width={75}
              height={20}
              className="h-auto w-auto"
            />
          </div>
          <h1 className="mb-6 text-3xl font-bold text-center">Bem-vindo ao pdmx</h1>
        
          <p className="mb-6 text-center text-gray-600">Inicie sessão para continuar</p>
          <LoginForm />
        </div>
      </main>
    </div>
  )
}