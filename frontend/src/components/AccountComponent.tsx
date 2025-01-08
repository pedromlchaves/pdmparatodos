'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getSession } from "next-auth/react"
import { getResponseCount } from '../app/actions'

export default function Account() {
    const [isLoading, setIsLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [responseCount, setResponseCount] = useState<number | null>(null)
    const [responseLimit, setResponseLimit] = useState<number | null>(null)
    const [lastReset, setLastReset] = useState<string | null>(null)

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
        return new Date(dateString).toLocaleDateString(undefined, options)
    }

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true)
            const session = await getSession()
            setUser(session?.user)
            setIsLoading(false)
        }

        const fetchResponseCount = async () => {
            try {
                const session = await getSession()
                const token = session?.user?.access_token
                if (!token) {
                    throw new Error("No access token found");
                }
                const { questions_asked, limit, last_reset } = await getResponseCount(token)
                setResponseCount(questions_asked)
                setResponseLimit(limit)
                setLastReset(last_reset)
            } catch (error) {
                console.error("Error fetching response count:", error)
            }
        }

        fetchUser()
        fetchResponseCount()
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
                                <p><strong>Limite Mensal de Perguntas:</strong> {responseLimit}</p>
                                <p><strong>Uso Atual:</strong> <span style={{ color: (responseCount ?? 0) > (responseLimit ?? 0) ? 'red' : 'inherit' }}>{responseCount ?? 0}</span></p>
                                <p><strong>Última reposição:</strong> {formatDate(lastReset)}</p>
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

