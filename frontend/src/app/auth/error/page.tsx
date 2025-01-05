"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import React, { Suspense } from 'react';

function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration. Please try again later."
      case "AccessDenied":
        return "Access denied. You may not have permission to access this resource."
      case "Verification":
        return "The verification failed. Please try signing in again."
      default:
        return "An error occurred during authentication. Please try again."
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Erro de Autenticação</h1>
        <p className="mb-6 text-gray-600">
          {error ? getErrorMessage(error) : "An unknown error occurred."}
        </p>
        <Button asChild>
          <Link href="/login">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}

export default function AuthErrorWrapper() {
  return (
    <Suspense fallback={<div>A carregar...</div>}>
      <AuthError />
    </Suspense>
  );
}