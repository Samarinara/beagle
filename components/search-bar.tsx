"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch: (query: string) => void
  loading: boolean
  initialQuery?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBar({
  onSearch,
  loading,
  initialQuery = "",
  className,
  autoFocus,
}: SearchBarProps) {
  const [value, setValue] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (value.trim() && !loading) {
      onSearch(value.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by ticker (e.g., AAPL) or CIK..."
          className="h-12 pl-10 pr-20 text-base"
          disabled={loading}
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && !loading && (
            <button
              type="button"
              onClick={() => {
                setValue("")
                inputRef.current?.focus()
              }}
              className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              <X className="size-4" />
            </button>
          )}
          <Button
            type="submit"
            disabled={!value.trim() || loading}
            size="sm"
            className="h-9"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            <span className="ml-1.5">{loading ? "Searching..." : "Search"}</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
