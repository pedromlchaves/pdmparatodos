"use client"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { getSession, signIn } from "next-auth/react"
import { getResponses } from "@/app/actions"
import { QuestionResponse } from "@/types" // Ensure this is the correct import
import { FloatingAlert } from '@/components/FloatingAlert'
const SimpleInteractionHistory = dynamic(() => import("@/components/HistoryComponent").then(mod => mod.SimpleInteractionHistory), { ssr: false })


export default function HistoryPage() {
  const [history, setQuestionHistory] = useState<QuestionResponse[]>([])

  useEffect(() => {
    const fetchResponses = async () => {
      const session = await getSession()

     const data = await getResponses()
     setQuestionHistory(data)

    }

    fetchResponses()
  }, [])

  return <SimpleInteractionHistory responses={history} />
}