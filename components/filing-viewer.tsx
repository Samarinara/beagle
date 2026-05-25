"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import {
  buildDocumentPath,
  buildSecDirectUrl,
  buildSecBaseUrl,
} from "@/lib/edgar"
import { MetricsDialog } from "@/components/metrics-dialog"
import { motion, AnimatePresence } from "framer-motion"
import type { Company, Filing } from "@/lib/types"

interface FilingViewerProps {
  company: Company
  filing: Filing
  onBack: () => void
}

export function FilingViewer({ company, filing, onBack }: FilingViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      setLoading(true)
      setError(false)

      const docPath = buildDocumentPath(
        company.cik,
        filing.accessionNumber,
        filing.primaryDocument
      )
      const baseUrl = buildSecBaseUrl(company.cik, filing.accessionNumber)

      try {
        const res = await fetch(docPath)
        if (!res.ok) throw new Error("Failed to load document")
        const text = await res.text()

        if (cancelled) return

        const doc = `<base href="${baseUrl}">${text}`
        setContent(doc)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDocument()
    return () => {
      cancelled = true
    }
  }, [company.cik, filing.accessionNumber, filing.primaryDocument])

  const handleIframeLoad = useCallback(() => {
    setLoading(false)
  }, [])

  const directUrl = buildSecDirectUrl(
    company.cik,
    filing.accessionNumber,
    filing.primaryDocument
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight">
              {filing.form} Filing &middot; {filing.filingDate}
            </h2>
            <p className="truncate text-xs tracking-wider text-muted-foreground uppercase">
              {company.name} {company.ticker && `(${company.ticker})`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MetricsDialog company={company} filing={filing} />
          <Button variant="outline" size="icon" asChild className="size-9">
            <a href={directUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      <div className="relative flex min-h-0 flex-1 overflow-hidden border border-border shadow-sm">
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <Loader2 className="size-8 animate-spin text-primary/50" />
              <p className="mt-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Loading Document
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <div className="text-center">
              <p className="text-sm font-medium">Failed to load document</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        {content && (
          <motion.iframe
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            srcDoc={content}
            className="h-full w-full border-0"
            onLoad={handleIframeLoad}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation"
          />
        )}
      </div>
    </div>
  )
}
