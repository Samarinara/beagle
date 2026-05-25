"use client"

import { Button } from "@/components/ui/button"
import { FilingCard } from "@/components/filing-card"
import { ChevronDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"
import type { Company, Filing } from "@/lib/types"

interface FilingListProps {
  company: Company
  filings: Filing[]
  visibleCount: number
  onLoadMore: () => void
  onSelectFiling: (filing: Filing) => void
  totalFilings: number
}

export function FilingList({
  company,
  filings,
  visibleCount,
  onLoadMore,
  onSelectFiling,
  totalFilings,
}: FilingListProps) {
  const visibleFilings = filings.slice(0, visibleCount)
  const hasMore = visibleCount < totalFilings

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-end justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{company.name}</h2>
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(visibleCount, totalFilings)} of {totalFilings}{" "}
            filings
            {company.ticker && (
              <>
                {" "}
                &middot;{" "}
                <span className="font-medium text-foreground">
                  {company.ticker}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <Separator className="mb-0" />
      <div className="flex flex-col">
        {visibleFilings.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No filings to display
          </div>
        ) : (
          visibleFilings.map((filing, i) => (
            <FilingCard
              key={filing.accessionNumber}
              filing={filing}
              onSelect={() => onSelectFiling(filing)}
              index={i}
            />
          ))
        )}
      </div>

      <AnimatePresence>
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex justify-center"
          >
            <Button
              variant="outline"
              onClick={onLoadMore}
              className="h-11 w-full"
            >
              <ChevronDown className="size-4" />
              <span className="ml-1.5">Load More Filings</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasMore && totalFilings > 10 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          All {totalFilings} filings loaded
        </motion.p>
      )}
    </div>
  )
}
