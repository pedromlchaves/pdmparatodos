import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Check, Wand2 } from 'lucide-react'
import { askQuestion } from '@/app/actions'
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import PDFViewer from './PDFViewer'
import { getSession } from 'next-auth/react'

const LOCAL_PDF_URL = '/pdm.pdf';

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

interface QuestionModalProps {
  properties: LocationProperties;
  selectedCity: string;
  disabled: boolean;
}

export function QuestionModal({ properties, selectedCity, disabled }: QuestionModalProps) {
  const [question, setQuestion] = useState('')
  const [questionResponse, setQuestionResponse] = useState<QuestionResponse | null>(null)
  const [isQuestionLoading, setIsQuestionLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [showPDF, setShowPDF] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfPage, setPdfPage] = useState(1)
  const [articlesPages, setArticlesPages] = useState<any>(null);

  useEffect(() => {
    const fetchArticlesPages = async () => {
      const response = await fetch('/api/articles-pages');
      const data = await response.json();
      setArticlesPages(data);
      console.log(data);
    };

    fetchArticlesPages();
  }, []);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuestionResponse(null);
    setIsQuestionLoading(true)
    setHasError(false)
    try {
      const session = await getSession()
      if (!session || !session.user.access_token) {
        setHasError(true);
        setIsQuestionLoading(false);
        return;
      }
      const token = session.user.access_token
      const response = await askQuestion(question, properties, token)
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


  const addLinksToMarkdown = (text: string) => {
    return text.replace(/(Artigo\s+\d+(?:\.\º)?)/g, (artigo) => {
      console.log(articlesPages)
      console.log(selectedCity)
      const municipality_pages = articlesPages[selectedCity]
      console.log(municipality_pages) 
      const page = municipality_pages[artigo];
      return `[${artigo}](#${page})`;
    });
  }

  return (
    <Dialog
  // onOpenChange={(isOpen) => {
  //   if (!isOpen) {
  //     setQuestion('');
  //     setQuestionResponse(null);
  //     setIsQuestionLoading(false);
  //     setHasError(false);
  //   }
  // }}
>
  <DialogTrigger asChild>
    <Button variant="outline" disabled={disabled}>
      <Wand2 className="w-4 h-4 mr-2" />
      Faça uma Pergunta
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[700px] w-full max-h-[80vh] h-[80vh] flex flex-col">
    <DialogHeader>
      <DialogTitle>Faça uma pergunta sobre esta localização</DialogTitle>
      <DialogDescription>
        Introduza a sua pergunta acerca desta localização.
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col flex-grow overflow-hidden h-full">
      <form onSubmit={handleQuestionSubmit} className="space-y-4 mb-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="question" className="text-right">
            Pergunta
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
                A gerar resposta...
              </>
            ) : (
              'Fazer pergunta'
            )}
          </Button>
        </div>
      </form>
      {questionResponse && (
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold mb-2">Resposta:</h3>
          <TooltipProvider>
            <Tooltip open={isCopied}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 ml-2"
                  onClick={handleCopyText}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copiar resposta</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={5}>
                <p>Resposta copiada para a área de transferência!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
         </div> 
          <div className="flex-grow overflow-auto">
            <div className="flex-grow overflow-auto">
              <ScrollArea className="h-[calc(100%-2rem)] pr-4">
                <div
                  className="text-sm prose prose-sm max-w-none text-justify break-words whitespace-normal overflow-hidden"
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-4">{children}</p>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          onClick={(e) => {
                            e.preventDefault();
                            const page = parseInt(href.slice(1));
                            if (!isNaN(page)) {
                              setPdfPage(page);
                              setShowPDF(true);
                            }
                          }}
                          className="text-blue-500 cursor-pointer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {addLinksToMarkdown(questionResponse.answer)}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
    <footer className="mt-4 text-xs text-gray-500 text-center">
      Aviso: Esta informação é fornecida apenas para orientação geral e não deve ser considerada como aconselhamento jurídico ou profissional.
    </footer>
    {showPDF && (
      <Dialog open={showPDF} onOpenChange={setShowPDF}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Plano Diretor Municipal - Regulamento</DialogTitle>
          </DialogHeader>
          <PDFViewer pdfUrl={LOCAL_PDF_URL} initialPage={pdfPage} />
        </DialogContent>
      </Dialog>
    )}
  </DialogContent>
</Dialog>




  )
}