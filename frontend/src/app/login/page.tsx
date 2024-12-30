import { authOptions } from "@/lib/auth"
import LoginButton from "@/components/LoginButton"

export default async function LoginPage() {
  // Access providers directly from authOptions
  const providers = authOptions.providers

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-3xl font-bold text-center">Welcome to City Map</h1>
        <p className="mb-6 text-center text-gray-600">Please sign in to continue</p>
        <div className="space-y-4">
          {Object.values(providers).map((provider: any) => (
            <LoginButton 
              key={provider.id} 
              provider={{
                id: provider.id,
                name: provider.name
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

