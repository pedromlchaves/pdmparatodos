'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { QuestionResponse } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import PDFViewer from './PDFViewer'
import Map from './Map'
const LOCAL_PDF_URL = '/pdm.pdf';

interface SimpleInteractionHistoryProps {
  responses: QuestionResponse[]
}

const cities = {
  Porto: [41.1579, -8.6291]
} as const

export function SimpleInteractionHistory({ responses }: SimpleInteractionHistoryProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [showPDF, setShowPDF] = useState(false)
  const [pdfPage, setPdfPage] = useState(1)
  const [articlesPages, setArticlesPages] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.3999, -8.2245])
  const [markers, setMarkers] = useState<[number, number][]>([])

  useEffect(() => {
    const fetchArticlesPages = async () => {
      const response = await fetch('/api/articles-pages');
      const data = await response.json();
      console.log(data)
      setArticlesPages(data);
    };

    fetchArticlesPages();
  }, []);

  const addLinksToMarkdown = (selectedCity: string, text: string) => {
    if (!articlesPages || !articlesPages[selectedCity]) {
      return text;  // Return the original text if the articlesPages are not loaded yet
    }
    
    return text.replace(/(Artigo\s+\d+(?:\.\º)?)/g, (artigo) => {
      const municipality_pages = articlesPages[selectedCity]
      const page = municipality_pages[artigo];
      return `[${artigo}](#${page})`;
    });
  }

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

  const handleCoordinateClick = (coordinates: [number, number]) => {
    setMapCenter(coordinates)
    setMarkers([coordinates])
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow p-4 flex items-center justify-center">
      <div className="flex flex-1 space-x-4">
      <Card className="flex-1 h-[400px] bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      <CardHeader>
            <CardTitle>Histórico de Perguntas</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-full pr-4 overflow-auto">
              {responses.map((response) => (
                <Collapsible
                  key={response.id}
                  open={openItems.has(response.id)}
                  onOpenChange={() => toggleItem(response.id)}
                >
                  <div className="mb-4 pb-4 border-b last:border-b-0">
                    <div className="flex items-center mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span
                        className="text-sm text-muted-foreground cursor-pointer"
                        onClick={() => handleCoordinateClick(response.coordinates)}
                      >
                        {response.coordinates[0].toFixed(4)}, {response.coordinates[1].toFixed(4)}
                      </span>
                    </div>
                    <p className="font-medium mb-2">{response.question}</p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {openItems.has(response.id) ? (
                          <ChevronUp className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        )}
                        {openItems.has(response.id) ? 'Esconder Resposta' : 'Mostrar Resposta'}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-4 text-sm text-justify">{children}</p>,
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
                              className="text-blue-500 cursor-pointer text-sm"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {addLinksToMarkdown(response.municipality, response.answer)}
                      </ReactMarkdown>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="flex-1 h-[400px] bg-white rounded-lg shadow-md overflow-hidden">
          <Map 
            center={mapCenter}
            markers={markers}
            zoom={markers.length > 0 ? 13 : 6}
          />
        </Card>
      </div>
      </main>
      <Footer />
      {showPDF && (
        <Dialog open={showPDF} onOpenChange={setShowPDF}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto z-index-high">
            <DialogHeader>
              <DialogTitle>Plano Diretor Municipal - Regulamento</DialogTitle>
            </DialogHeader>
            <PDFViewer pdfUrl={LOCAL_PDF_URL} initialPage={pdfPage} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

