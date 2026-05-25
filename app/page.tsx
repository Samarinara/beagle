"use client"

import { useState, useCallback } from "react"
import { SearchBar } from "@/components/search-bar"
import { FilingList } from "@/components/filing-list"
import { FilingViewer } from "@/components/filing-viewer"
import { searchCompany, fetchFilings } from "@/lib/edgar"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
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
    [state]
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
        isViewing ? "h-dvh overflow-hidden" : "min-h-svh"
      )}
    >
      <motion.div
        layout
        className={cn(
          "mx-auto flex w-full flex-col",
          isViewing
            ? "min-h-0 flex-1 px-6 pt-2 pb-3"
            : "px-6 pt-[15vh] pb-12 sm:pt-[20vh]",
          isIdle ? "max-w-xl items-center justify-center pt-0" : "max-w-3xl"
        )}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      >
        {/* Hero / Header */}
        <motion.div layout className={cn("w-full", isIdle && "text-center")}>
          {isIdle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <h1 className="text-4xl font-bold tracking-tight">Beagle</h1>
              <p className="mt-2 text-muted-foreground">
                EDGAR Filing Explorer
              </p>
            </motion.div>
          )}

          {!isViewing && (
            <motion.div layout>
              <SearchBar
                onSearch={handleSearch}
                loading={isSearching}
                initialQuery={getInitialQuery()}
                autoFocus={isIdle}
              />
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Skeleton loading */}
          {isSearching && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <SkeletonList />
            </motion.div>
          )}

          {/* Error */}
          {state.type === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 w-full"
            >
              <div className="rounded-none border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">
                      Error
                    </p>
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
            </motion.div>
          )}

          {/* Results */}
          {state.type === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <FilingList
                company={state.company}
                filings={state.filings}
                visibleCount={state.visibleCount}
                onLoadMore={handleLoadMore}
                onSelectFiling={handleSelectFiling}
                totalFilings={state.filings.length}
              />
            </motion.div>
          )}

          {/* Viewer */}
          {state.type === "viewing" && (
            <motion.div
              key="viewing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <FilingViewer
                company={state.company}
                filing={state.selectedFiling}
                onBack={handleBack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="mt-6">
      <div className="mb-3 space-y-1.5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="border border-border">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            <Skeleton className="size-5" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-14" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
