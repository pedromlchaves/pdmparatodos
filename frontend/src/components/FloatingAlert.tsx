'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const alertVariants = cva(
  "fixed top-4 right-4 w-80 p-4 rounded-lg shadow-lg transition-opacity duration-300 flex items-start",
  {
    variants: {
      variant: {
        default: "bg-white border border-gray-200",
        red: "bg-red-50 border border-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface FloatingAlertProps extends VariantProps<typeof alertVariants> {
  title: string
  description: string
  show: boolean
  onClose?: () => void
}

export function FloatingAlert({ 
  title, 
  description, 
  show, 
  onClose, 
  variant,
}: FloatingAlertProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [show])

  return (
    <div
      className={cn(
        alertVariants({ variant }),
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <h5 className="text-sm font-medium text-red-800">{title}</h5>
        </div>
        <p className="mt-1 text-sm text-red-700">{description}</p>
      </div>
      <button onClick={onClose} className="text-red-500 hover:text-red-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

