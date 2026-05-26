"use client"

import { FileText, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import type { Filing } from "@/lib/types"

interface FilingCardProps {
  filing: Filing
  onSelect: () => void
  index?: number
}

const formTypeVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  "10-K": "default",
  "10-Q": "secondary",
  "8-K": "outline",
}

export function FilingCard({ filing, onSelect, index = 0 }: FilingCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted active:scale-[0.995] last:border-b-0"
      )}
    >
      <div className="flex shrink-0 items-center justify-center">
        <FileText className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Badge
          variant={formTypeVariants[filing.form] || "outline"}
          className="shrink-0"
        >
          {filing.form}
        </Badge>
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
    </motion.button>
  )
}
