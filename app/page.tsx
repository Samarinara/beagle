"use client"

import { useState, useCallback } from "react"
import { SearchBar } from "@/components/search-bar"
import { FilingList } from "@/components/filing-list"
import { FilingViewer } from "@/components/filing-viewer"
import { searchCompany, fetchFilings } from "@/lib/edgar"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Company, Filing } from "@/lib/types"

type ViewState =
  | { type: "idle" }
  | { type: "searching"; query: string }
  | { type: "error"; message: string; query: string }
  | {
      type: "results"
      company: Company
      filings: Filing[]
      visibleCount: number
    }
  | {
      type: "viewing"
      company: Company
      filings: Filing[]
      visibleCount: number
      selectedFiling: Filing
    }

export default function Page() {
  const [state, setState] = useState<ViewState>({ type: "idle" })

  const handleSearch = useCallback(async (query: string) => {
    setState({ type: "searching", query })
    try {
      const company = await searchCompany(query)
      const result = await fetchFilings(company.cik)
      const companyWithName =
        result.name && !company.name.startsWith("CIK")
          ? company
          : { ...company, name: result.name || company.name }
      setState({
        type: "results",
        company: companyWithName,
        filings: result.filings,
        visibleCount: 10,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred"
      setState({ type: "error", message, query })
    }
  }, [])

  const handleLoadMore = useCallback(() => {
    if (state.type !== "results" && state.type !== "viewing") return
    setState({ ...state, visibleCount: state.visibleCount + 10 })
  }, [state])

  const handleSelectFiling = useCallback(
    (filing: Filing) => {
      if (state.type !== "results") return
      setState({
        ...state,
        type: "viewing",
        selectedFiling: filing,
      })
    },
    [state],
  )

  const handleBack = useCallback(() => {
    if (state.type !== "viewing") return
    setState({
      type: "results",
      company: state.company,
      filings: state.filings,
      visibleCount: state.visibleCount,
    })
  }, [state])

  const handleRetry = useCallback(() => {
    if (state.type !== "error") return
    handleSearch(state.query)
  }, [state, handleSearch])

  const isIdle = state.type === "idle"
  const isSearching = state.type === "searching"
  const isViewing = state.type === "viewing"

  const getInitialQuery = () => {
    if (state.type === "searching" || state.type === "error") return state.query
    return ""
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        isViewing ? "h-dvh overflow-hidden" : "min-h-svh",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col",
          isViewing
            ? "min-h-0 flex-1 px-6 pb-3 pt-2"
            : "px-6 pb-12 pt-[15vh] sm:pt-[20vh]",
          isIdle ? "max-w-xl items-center justify-center pt-0" : "max-w-3xl",
        )}
      >
        {/* Hero / Header */}
        <div className={cn("w-full", isIdle && "text-center")}>
          {isIdle && (
            <div className="mb-10">
              <h1 className="text-4xl font-bold tracking-tight">Beagle</h1>
              <p className="mt-2 text-muted-foreground">
                EDGAR Filing Explorer
              </p>
            </div>
          )}

          {!isViewing && (
            <SearchBar
              onSearch={handleSearch}
              loading={isSearching}
              initialQuery={getInitialQuery()}
              autoFocus={isIdle}
            />
          )}
        </div>

        {/* Skeleton loading */}
        {isSearching && <SkeletonList />}

        {/* Error */}
        {state.type === "error" && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2">
            <div className="rounded-none border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {state.message}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="shrink-0"
                >
                  <RefreshCw className="mr-1.5 size-3" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {state.type === "results" && (
          <FilingList
            company={state.company}
            filings={state.filings}
            visibleCount={state.visibleCount}
            onLoadMore={handleLoadMore}
            onSelectFiling={handleSelectFiling}
            totalFilings={state.filings.length}
          />
        )}

        {/* Viewer */}
        {state.type === "viewing" && (
          <FilingViewer
            company={state.company}
            filing={state.selectedFiling}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="mt-6 animate-in fade-in">
      <div className="mb-3 space-y-1.5">
        <div className="h-5 w-48 animate-pulse rounded-none bg-muted" />
        <div className="h-4 w-36 animate-pulse rounded-none bg-muted" />
      </div>
      <div className="border border-border">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            <div className="size-5 rounded-none bg-muted" />
            <div className="flex items-center gap-3">
              <div className="h-5 w-14 rounded-none bg-muted" />
              <div className="space-y-1.5">
                <div className="h-4 w-64 rounded-none bg-muted" />
                <div className="h-3 w-24 rounded-none bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
