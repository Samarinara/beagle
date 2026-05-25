"use client"

import { Button } from "@/components/ui/button"
import { FilingCard } from "@/components/filing-card"
import { ChevronDown } from "lucide-react"
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
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{company.name}</h2>
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(visibleCount, totalFilings)} of {totalFilings}{" "}
            filings
            {company.ticker && (
              <>
                {" "}&middot;{" "}{company.ticker}
              </>
            )}
          </p>
        </div>
      </div>
      <div className="border border-border">
        {visibleFilings.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
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
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="w-full"
          >
            <ChevronDown className="size-4" />
            <span className="ml-1.5">Load More Filings</span>
          </Button>
        </div>
      )}
      {!hasMore && totalFilings > 10 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          All {totalFilings} filings loaded
        </p>
      )}
    </div>
  )
}
