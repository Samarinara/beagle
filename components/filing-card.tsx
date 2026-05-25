"use client"

import { FileText, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Filing } from "@/lib/types"

interface FilingCardProps {
  filing: Filing
  onSelect: () => void
  index?: number
}

const formTypeColors: Record<string, string> = {
  "10-K": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "10-Q":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "8-K": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
}

function getFormColor(form: string): string {
  return formTypeColors[form] || "bg-muted text-muted-foreground"
}

export function FilingCard({ filing, onSelect, index = 0 }: FilingCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-all last:border-b-0 hover:bg-muted/50",
        "animate-in fade-in slide-in-from-bottom-1 fill-mode-both",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex shrink-0 items-center justify-center">
        <FileText className="size-5 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-none px-2 py-0.5 text-xs font-medium",
            getFormColor(filing.form),
          )}
        >
          {filing.form}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {filing.description || `${filing.form} Filing`}
          </div>
          <div className="text-xs text-muted-foreground">
            Filed {filing.filingDate}
          </div>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}
