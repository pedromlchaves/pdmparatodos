import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy } from 'lucide-react'
import { askQuestion } from '@/app/actions'
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface QuestionResponse {
  articles: string[];
  answer: string;
}

interface LocationItem {
  [key: string]: any; // This allows for any key-value pair since layer properties can vary
}

interface LocationLayer {
  [key: string]: LocationItem[];
}

interface LocationProperties {
  [key: string]: LocationLayer;
}

export function QuestionModal({ properties }: LocationProperties) {
  const [question, setQuestion] = useState('')
  const [questionResponse, setQuestionResponse] = useState<QuestionResponse | null>(null)
  const [isQuestionLoading, setIsQuestionLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsQuestionLoading(true)
    setHasError(false)
    try {
      {/* @ts-expect-error need better research on types */}
      const response = await askQuestion(question, properties)
      setQuestionResponse(response)
    } catch (error) {
      console.error("Error submitting question:", error)
      setHasError(true)
      setQuestionResponse({
        articles: [],
        answer: "We're sorry, but we couldn't process your question at this time. Please try again later."
      })
    } finally {
      setIsQuestionLoading(false)
    }
  }

  const handleCopyText = async () => {
    if (questionResponse) {
      try {
        await navigator.clipboard.writeText(questionResponse.answer);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Ask a Question</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ask a question about this location</DialogTitle>
          <DialogDescription>
            Enter your question about the selected location.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col flex-grow overflow-hidden">
          <form onSubmit={handleQuestionSubmit} className="space-y-4 mb-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question" className="text-right">
                Question
              </Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isQuestionLoading}>
                {isQuestionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Question'
                )}
              </Button>
            </div>
          </form>
          {questionResponse && (
            <ScrollArea className="flex-grow pr-4 mr-4">
              <div className="space-y-4">
                {hasError && (
                  <p className="text-red-500">An error occurred while processing your question.</p>
                )}
                <div className="relative pr-8">
                  <h3 className="font-semibold mb-2">Response:</h3>
                  <TooltipProvider>
                    <Tooltip open={isCopied}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-0 right-0 h-8 w-8"
                          onClick={handleCopyText}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy response</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" sideOffset={5}>
                        <p>Answer copied to clipboard!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="text-sm prose prose-sm max-w-none text-justify">
                  <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-4">{children}</p>,
                      }}
                    >
                      {questionResponse.answer}
                    </ReactMarkdown>
                  </div>
                </div>
                {/* {questionResponse.articles.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Articles:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {questionResponse.articles.map((article, index) => (
                        <li key={index} className="text-sm">{article}</li>
                      ))}
                    </ul>
                  </div>
                )} */}
              </div>
            </ScrollArea>
          )}
        </div>
        <footer className="mt-4 text-xs text-gray-500">
          Disclaimer: This information is provided for general guidance only and should not be relied upon as legal or professional advice.
        </footer>
      </DialogContent>
    </Dialog>
  )
}