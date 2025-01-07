'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getSession } from "next-auth/react"

export default function Account() {
    const [isLoading, setIsLoading] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true)
            const session = await getSession()
            setUser(session?.user)
            setIsLoading(false)
        }
        fetchUser()
    }, [])

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <main className="flex-grow p-4 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Informações da conta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : user ? (
                            <div>
                                <p><strong>Nome:</strong> {user.name}</p>
                                <p><strong>E-mail:</strong> {user.email}</p>
                                {/* Add more user information as needed */}
                            </div>
                        ) : (
                            <p>Não foi possível carregar as informações da conta.</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        {/* Add any footer content if needed */}
                    </CardFooter>
                </Card>
            </main>
            <Footer />
        </div>
    )
}

