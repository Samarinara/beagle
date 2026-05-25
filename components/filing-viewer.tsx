"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react"
import {
  buildDocumentPath,
  buildSecDirectUrl,
  buildSecBaseUrl,
} from "@/lib/edgar"
import { MetricsDialog } from "@/components/metrics-dialog"
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
        filing.primaryDocument,
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
    return () => { cancelled = true }
  }, [company.cik, filing.accessionNumber, filing.primaryDocument])

  const handleIframeLoad = useCallback(() => {
    setLoading(false)
  }, [])

  const directUrl = buildSecDirectUrl(
    company.cik,
    filing.accessionNumber,
    filing.primaryDocument,
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-2">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold">
              {filing.form} Filing &middot; {filing.filingDate}
            </h2>
            <p className="text-xs text-muted-foreground">{company.name}</p>
          </div>
        </div>
        <MetricsDialog company={company} filing={filing} />
        <Button variant="ghost" size="icon" asChild>
          <a href={directUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 border border-border">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <p className="text-sm text-muted-foreground">
              Failed to load document.
            </p>
          </div>
        )}
        {content && (
          <iframe
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
