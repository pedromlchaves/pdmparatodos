import { authOptions } from "@/lib/auth"
import LoginForm from "@/components/LoginForm"

export default async function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-3xl font-bold text-center">Welcome to City Map</h1>
        <p className="mb-6 text-center text-gray-600">Please sign in to continue</p>
        <LoginForm />
      </div>
    </div>
  )
}