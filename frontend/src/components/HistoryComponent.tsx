'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

interface Interaction {
  id: string
  coordinates: [number, number]
  question: string
  answer: string
  articles: string[]
}

interface SimpleInteractionHistoryProps {
  interactions: Interaction[]
}

export function SimpleInteractionHistory({ interactions }: SimpleInteractionHistoryProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
                <Header />
                <main className="flex-grow p-4 flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Past Interactions</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {interactions.map((interaction) => (
            <Collapsible
              key={interaction.id}
              open={openItems.has(interaction.id)}
              onOpenChange={() => toggleItem(interaction.id)}
            >
              <div className="mb-4 pb-4 border-b last:border-b-0">
                <div className="flex items-center mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm text-muted-foreground">
                    {interaction.coordinates[0].toFixed(4)}, {interaction.coordinates[1].toFixed(4)}
                  </span>
                </div>
                <p className="font-medium mb-2">{interaction.question}</p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {openItems.has(interaction.id) ? (
                      <ChevronUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    {openItems.has(interaction.id) ? 'Hide Answer' : 'Show Answer'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <p className="text-sm mb-2">{interaction.answer}</p>
                  {interaction.articles.length > 0 && (
                    <>
                      <h4 className="font-semibold text-sm mb-1">Related Articles:</h4>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        {interaction.articles.map((article, index) => (
                          <li key={index}>{article}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
    </main>
                <Footer />
            </div>
  )
}

