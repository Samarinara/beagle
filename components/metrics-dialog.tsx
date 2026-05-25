"use client"

import { useState, useCallback } from "react"
import {
  Loader2, BarChart3, AlertTriangle, Sparkles, Settings2, Eye, EyeOff,
  ChevronDown, ChevronRight, Cpu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { FinancialMetric, Company, Filing, LLMConfig } from "@/lib/types"

const LLM_CONFIG_KEY = "beagle:llm-config"

function loadLLMConfig(): LLMConfig {
  if (typeof window === "undefined") return { apiKey: "", model: "" }
  try {
    const raw = localStorage.getItem(LLM_CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { apiKey: "", model: "anthropic/claude-sonnet-4-20250514" }
}

function saveLLMConfig(config: LLMConfig) {
  localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config))
}

interface MetricsDialogProps {
  company: Company
  filing: Filing
}

function formatValue(metric: FinancialMetric): string {
  const { value, unit } = metric
  if (value === null) return "N/A"

  if (unit === "USD/share") {
    return `$${value.toFixed(2)}`
  }

  if (unit === "shares") {
    return (
      (value / 1_000_000).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }) + "M"
    )
  }

  const abs = Math.abs(value)
  if (abs >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`
  }
  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`
  }
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}M`
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`
  }
  return `$${value.toLocaleString("en-US")}`
}

function getStatementLabel(statement: string): string {
  switch (statement) {
    case "income_statement":
      return "Income Statement"
    case "balance_sheet":
      return "Balance Sheet"
    case "cash_flow":
      return "Cash Flow"
    default:
      return statement.charAt(0).toUpperCase() + statement.slice(1)
  }
}

function getMetricIcon(label: string): string {
  const icons: Record<string, string> = {
    Revenue: "\u{1F4CA}",
    "Cost of Revenue": "\u{1F3ED}",
    "Gross Profit": "\u{1F4B0}",
    "Research & Development": "\u{1F52C}",
    "SG&A": "\u{1F4CB}",
    "Operating Income": "\u{2699}\u{FE0F}",
    "Interest Expense": "\u{1F4B8}",
    "Interest Income": "\u{1F4B9}",
    "Other Income": "\u{1F4CE}",
    "Income Before Tax": "\u{1F9FE}",
    "Tax Provision": "\u{1F3DB}\u{FE0F}",
    "Net Income": "\u{1F4C8}",
    "Net Income from Continuing Ops": "\u{1F4C8}",
    "Earnings Per Share": "\u{1F4B5}",
    "Diluted EPS": "\u{1F4B5}",
    "Weighted Average Shares": "\u{1F4CA}",
    "Weighted Average Shares Diluted": "\u{1F4CA}",
    EBITDA: "\u{1F4CA}",
    "Total Assets": "\u{1F3E6}",
    "Current Assets": "\u{1F3E6}",
    "Cash & Equivalents": "\u{1F4B5}",
    "Short-term Investments": "\u{1F4C8}",
    "Accounts Receivable": "\u{1F4E8}",
    Inventories: "\u{1F4E6}",
    "Property Plant & Equipment": "\u{1F3D7}\u{FE0F}",
    Goodwill: "\u{1F91D}",
    "Intangible Assets": "\u{1F9E0}",
    "Long-term Investments": "\u{1F4C8}",
    "Other Assets": "\u{1F4CB}",
    "Current Liabilities": "\u{1F4C9}",
    "Accounts Payable": "\u{1F4E4}",
    "Short-term Debt": "\u{1F4B3}",
    "Deferred Revenue": "\u{1F4C5}",
    "Long-term Debt": "\u{1F3E6}",
    "Other Liabilities": "\u{1F4CB}",
    "Total Liabilities": "\u{1F4C9}",
    "Total Equity": "\u{1F3DB}\u{FE0F}",
    "Cash From Operations": "\u{1F4A7}",
    CapEx: "\u{1F3D7}\u{FE0F}",
    "Cash From Investing": "\u{1F4E5}",
    "Cash From Financing": "\u{1F4E4}",
    "Free Cash Flow": "\u{1F48E}",
    "Stock-based Compensation": "\u{1F4DC}",
    "Depreciation & Amortization": "\u{1F4C9}",
    "Dividends Paid": "\u{1F49D}",
    "Share Repurchases": "\u{1F504}",
    "Net Change in Cash": "\u{1F4B1}",
    "Free Cash Flow (Computed)": "\u{1F48E}",
    "Working Capital": "\u{2696}\u{FE0F}",
  }
  return icons[label] || "\u{1F4CB}"
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return tokens.toLocaleString()
}

function getModelContextWindow(model: string): number {
  const known: Record<string, number> = {
    "claude-sonnet-4": 200_000,
    "gpt-4o": 128_000,
    "gpt-4.1": 1_047_576,
    "gemini-2.5": 1_048_576,
    "deepseek-v4": 1_000_000,
    "qwen3": 1_000_000,
    "llama-4": 256_000,
    "mistral-large": 128_000,
  }
  for (const [key, ctx] of Object.entries(known)) {
    if (model.includes(key)) return ctx
  }
  return 128_000
}

const PRESET_MODELS = [
  "anthropic/claude-sonnet-4-20250514",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "deepseek/deepseek-v4-flash",
  "qwen/qwen3.6-plus-preview",
]

export function MetricsDialog({ company, filing }: MetricsDialogProps) {
  const [open, setOpen] = useState(false)
  const [metrics, setMetrics] = useState<FinancialMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"standard" | "ai">("standard")
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(loadLLMConfig)
  const [showKey, setShowKey] = useState(false)
  const [showAiConfig, setShowAiConfig] = useState(false)
  const [estimatedTokens, setEstimatedTokens] = useState<number | null>(null)
  const [checkingSize, setCheckingSize] = useState(false)

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (newOpen) {
        setLoading(true)
        setError(null)
        setMetrics([])
        setEstimatedTokens(null)
        setMode("standard")
        setLlmConfig(loadLLMConfig())

        const params = new URLSearchParams({
          accessionNumber: filing.accessionNumber,
          primaryDocument: filing.primaryDocument,
          form: filing.form,
        })

        fetch(`/api/metrics/${company.cik}?${params}`)
          .then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}))
              throw new Error(data.error || `Failed to load metrics (${res.status})`)
            }
            return res.json()
          })
          .then((data) => {
            setMetrics(data.metrics || [])
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to extract metrics")
          })
          .finally(() => {
            setLoading(false)
          })
      }
    },
    [company.cik, filing.accessionNumber, filing.primaryDocument, filing.form],
  )

  const handleCheckSize = useCallback(async () => {
    setCheckingSize(true)
    setEstimatedTokens(null)
    try {
      const params = new URLSearchParams({
        accessionNumber: filing.accessionNumber,
        primaryDocument: filing.primaryDocument,
        form: filing.form,
        mode: "estimate",
      })
      const res = await fetch(`/api/metrics/${company.cik}?${params}`)
      if (!res.ok) throw new Error("Failed to check document size")
      const data = await res.json()
      setEstimatedTokens(data.estimatedTokens || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check document size")
    } finally {
      setCheckingSize(false)
    }
  }, [company.cik, filing.accessionNumber, filing.primaryDocument, filing.form])

  const handleAiExtract = useCallback(async () => {
    if (!llmConfig.apiKey || !llmConfig.model) return

    setLoading(true)
    setError(null)
    setMetrics([])
    setMode("ai")
    saveLLMConfig(llmConfig)

    try {
      const params = new URLSearchParams({
        accessionNumber: filing.accessionNumber,
        primaryDocument: filing.primaryDocument,
        form: filing.form,
        mode: "llm",
        openRouterKey: llmConfig.apiKey,
        model: llmConfig.model,
      })

      const res = await fetch(`/api/metrics/${company.cik}?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `AI extraction failed (${res.status})`)
      }
      const data = await res.json()
      setMetrics(data.metrics || [])
      setEstimatedTokens(data.estimatedTokens || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI extraction failed")
    } finally {
      setLoading(false)
    }
  }, [company.cik, filing.accessionNumber, filing.primaryDocument, filing.form, llmConfig])

  const contextWindow = getModelContextWindow(llmConfig.model)

  const grouped = metrics.reduce(
    (acc, m) => {
      const key = m.statement || "other"
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
      return acc
    },
    {} as Record<string, FinancialMetric[]>,
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Financial Highlights">
          <BarChart3 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Financial Highlights</DialogTitle>
          <DialogDescription>
            {company.name} &middot; {filing.form} filed {filing.filingDate}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 max-h-[65vh] overflow-y-auto px-6">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowAiConfig(!showAiConfig)}
              className="flex w-full items-center gap-2 rounded-none border border-border bg-muted/50 px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {showAiConfig ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              <Sparkles className="size-4 text-amber-500" />
              AI Extraction
              {llmConfig.apiKey && <span className="ml-auto text-xs text-green-600">Configured</span>}
            </button>

            {showAiConfig && (
              <div className="border border-t-0 border-border p-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">OpenRouter API Key</label>
                  <div className="mt-1 flex gap-1">
                    <div className="relative flex-1">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={llmConfig.apiKey}
                        onChange={(e) => setLlmConfig((p) => ({ ...p, apiKey: e.target.value }))}
                        placeholder="sk-or-v1-..."
                        className="pr-8 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Model</label>
                  <div className="mt-1 flex gap-1">
                    <Input
                      type="text"
                      value={llmConfig.model}
                      onChange={(e) => setLlmConfig((p) => ({ ...p, model: e.target.value }))}
                      placeholder="anthropic/claude-sonnet-4-20250514"
                      list="model-suggestions"
                      className="font-mono text-xs"
                    />
                    <datalist id="model-suggestions">
                      {PRESET_MODELS.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckSize}
                    disabled={checkingSize}
                    className="text-xs"
                  >
                    {checkingSize ? (
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                    ) : (
                      <Settings2 className="mr-1.5 size-3" />
                    )}
                    Check Size
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleAiExtract}
                    disabled={!llmConfig.apiKey || !llmConfig.model || loading}
                    className="text-xs"
                  >
                    <Sparkles className="mr-1.5 size-3" />
                    Extract with AI
                  </Button>
                </div>

                {estimatedTokens !== null && (
                  <div className="flex items-center gap-2 text-xs">
                    <Cpu className="size-3.5 text-muted-foreground" />
                    <span>
                      ~{formatTokenCount(estimatedTokens)} tokens
                    </span>
                    <span className="text-muted-foreground">
                      (model context: {formatTokenCount(contextWindow)})
                    </span>
                    {estimatedTokens > contextWindow && (
                      <span className="text-destructive font-medium">
                        Exceeds context window!
                      </span>
                    )}
                    {estimatedTokens > 0 && estimatedTokens <= contextWindow && (
                      <div className="ml-auto flex items-center gap-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            estimatedTokens / contextWindow > 0.8
                              ? "bg-amber-500"
                              : estimatedTokens / contextWindow > 0.5
                                ? "bg-amber-400"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min((estimatedTokens / contextWindow) * 100, 100)}%`, maxWidth: 60 }}
                        />
                        <span className="text-muted-foreground">
                          {Math.round((estimatedTokens / contextWindow) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4 flex gap-1">
            <button
              type="button"
              onClick={() => {
                if (mode !== "standard") {
                  setMode("standard")
                  setLoading(true)
                  setError(null)
                  setMetrics([])
                  const params = new URLSearchParams({
                    accessionNumber: filing.accessionNumber,
                    primaryDocument: filing.primaryDocument,
                    form: filing.form,
                  })
                  fetch(`/api/metrics/${company.cik}?${params}`)
                    .then(async (res) => {
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.error || `Failed to load metrics (${res.status})`)
                      }
                      return res.json()
                    })
                    .then((data) => setMetrics(data.metrics || []))
                    .catch((err) => setError(err instanceof Error ? err.message : "Failed to extract metrics"))
                    .finally(() => setLoading(false))
                }
              }}
              className={`rounded-none px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "standard"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => {
                if (mode !== "ai" && llmConfig.apiKey && !loading) {
                  handleAiExtract()
                }
              }}
              className={`rounded-none px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "ai"
                  ? "bg-amber-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Sparkles className="mr-1 inline size-3" />
              AI
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-none border border-destructive/50 bg-destructive/10 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && metrics.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {mode === "standard"
                ? "No financial data could be extracted from this filing."
                : "No metrics returned by AI extraction."}
            </div>
          )}

          {!loading &&
            !error &&
            Object.entries(grouped).map(([statement, items]) => (
              <div key={statement} className="mb-4 last:mb-0">
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {getStatementLabel(statement)}
                </h4>
                <div className="divide-y divide-border border border-border">
                  {items.map((m, i) => (
                    <div
                      key={`${m.label}-${m.period}-${i}`}
                      className="flex items-center justify-between px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-sm shrink-0">{getMetricIcon(m.label)}</span>
                        <span className="truncate text-sm">{m.label}</span>
                        {m.period && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {m.period}
                          </span>
                        )}
                      </div>
                      <span className="ml-2 shrink-0 text-sm font-medium tabular-nums">
                        {formatValue(m)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {!loading && !error && metrics.length > 0 && (
            <p className="pb-2 text-xs text-muted-foreground">
              {mode === "standard"
                ? "Values as reported. Dollar amounts in millions unless noted."
                : `AI-extracted values (${formatTokenCount(estimatedTokens || 0)} tokens processed). Verify critical figures.`}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
