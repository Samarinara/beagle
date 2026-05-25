"use client"

import { useState, useCallback } from "react"
import { Loader2, BarChart3, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { FinancialMetric, Company, Filing } from "@/lib/types"

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
    return (value / 1_000_000).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }) + "M"
  }

  const abs = Math.abs(value)

  if (abs >= 1_000_000_000_000) {
    const inTrillions = value / 1_000_000_000_000
    return `$${inTrillions.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`
  }

  if (abs >= 1_000_000_000) {
    const inBillions = value / 1_000_000_000
    return `$${inBillions.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`
  }

  if (abs >= 1_000_000) {
    const inMillions = value / 1_000_000
    return `$${inMillions.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}M`
  }

  if (abs >= 1_000) {
    const inThousands = value / 1_000
    return `$${inThousands.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`
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
      return statement
  }
}

function getMetricIcon(label: string): string {
  const icons: Record<string, string> = {
    Revenue: "📊",
    "Cost of Revenue": "🏭",
    "Gross Profit": "💰",
    "Research & Development": "🔬",
    "SG&A": "📋",
    "Operating Income": "⚙️",
    "Interest Expense": "💸",
    "Interest Income": "💹",
    "Other Income": "📎",
    "Income Before Tax": "🧾",
    "Tax Provision": "🏛️",
    "Net Income": "📈",
    "Net Income from Continuing Ops": "📈",
    "Earnings Per Share": "💵",
    "Diluted EPS": "💵",
    "Weighted Average Shares": "📊",
    "Weighted Average Shares Diluted": "📊",
    EBITDA: "📊",
    "Total Assets": "🏦",
    "Current Assets": "🏦",
    "Cash & Equivalents": "💵",
    "Short-term Investments": "📈",
    "Accounts Receivable": "📨",
    Inventories: "📦",
    "Property Plant & Equipment": "🏗️",
    Goodwill: "🤝",
    "Intangible Assets": "🧠",
    "Long-term Investments": "📈",
    "Other Assets": "📋",
    "Current Liabilities": "📉",
    "Accounts Payable": "📤",
    "Short-term Debt": "💳",
    "Deferred Revenue": "📅",
    "Long-term Debt": "🏦",
    "Other Liabilities": "📋",
    "Total Liabilities": "📉",
    "Total Equity": "🏛️",
    "Cash From Operations": "💧",
    CapEx: "🏗️",
    "Cash From Investing": "📥",
    "Cash From Financing": "📤",
    "Free Cash Flow": "💎",
    "Stock-based Compensation": "📜",
    "Depreciation & Amortization": "📉",
    "Dividends Paid": "💝",
    "Share Repurchases": "🔄",
    "Net Change in Cash": "💱",
    "Free Cash Flow (Computed)": "💎",
    "Working Capital": "⚖️",
  }
  return icons[label] || "📋"
}

export function MetricsDialog({ company, filing }: MetricsDialogProps) {
  const [open, setOpen] = useState(false)
  const [metrics, setMetrics] = useState<FinancialMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (newOpen) {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Financial Highlights</DialogTitle>
          <DialogDescription>
            {company.name} &middot; {filing.form} filed {filing.filingDate}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 max-h-[60vh] overflow-y-auto px-6">
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
              No financial data could be extracted from this filing.
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
                  {items.map((m) => (
                    <div
                      key={m.label}
                      className="flex items-center justify-between px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getMetricIcon(m.label)}</span>
                        <span className="text-sm">{m.label}</span>
                      </div>
                      <span className="text-sm font-medium tabular-nums">
                        {formatValue(m)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {!loading && !error && metrics.length > 0 && (
            <p className="pb-2 text-xs text-muted-foreground">
              Values as reported. Dollar amounts in millions unless noted.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
