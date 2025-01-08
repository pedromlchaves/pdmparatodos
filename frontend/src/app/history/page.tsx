"use client"
import { useState, useEffect } from "react"
import { getSession } from "next-auth/react"
import { getResponses } from "@/app/actions"
import { QuestionResponse } from "@/types" // Ensure this is the correct import
import { SimpleInteractionHistory } from "@/components/HistoryComponent"

export default function HistoryPage() {
  const [history, setQuestionHistory] = useState<QuestionResponse[]>([])

  useEffect(() => {
    const fetchResponses = async () => {
      const session = await getSession()
      if (!session) {
        // Handle unauthenticated state
        return
      }

      const accessToken = session.user.access_token
      if (!accessToken) {
        // Handle missing access token
        return
      }
      
      const data = await getResponses(accessToken)
      setQuestionHistory(data)
    }

    fetchResponses()
  }, [])

  return <SimpleInteractionHistory responses={history} />
}