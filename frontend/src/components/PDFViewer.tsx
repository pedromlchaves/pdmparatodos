'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const PDFDocument = dynamic(() => import('react-pdf').then(mod => mod.Document), {
  ssr: false,
  loading: () => <Loader2 className="h-8 w-8 animate-spin" />,
});

const PDFPage = dynamic(() => import('react-pdf').then(mod => mod.Page), {
  ssr: false,
});

interface PDFViewerProps {
  pdfUrl: string;
}

interface PDFViewerProps {
    pdfUrl: string;
    initialPage?: number;
  }
  
  const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, initialPage = 1 }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [scale, setScale] = useState(1);
  
    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
      setNumPages(numPages);
      setPageNumber(initialPage);
    }
  
    const changePage = (offset: number) => {
      setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1));
    }
  
    const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.1, 2));
    const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  
    return (
      <div className="pdf-viewer flex flex-col items-center justify-center h-full">
        <div className="flex-grow overflow-auto">
          <PDFDocument
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-center">Loading PDF...</div>}
          >
            <PDFPage 
              pageNumber={pageNumber} 
              scale={scale}
              loading={<div className="text-center">Loading page...</div>}
              className="max-w-full"
            />
          </PDFDocument>
        </div>
        <div className="flex justify-between items-center mt-4 p-2 bg-gray-100 rounded-b-lg">
          <div className="flex items-center space-x-2">
            <Button onClick={() => changePage(-1)} disabled={pageNumber <= 1} variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <Button onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)} variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={zoomOut} variant="outline" size="sm">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button onClick={zoomIn} variant="outline" size="sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  export default PDFViewer;
