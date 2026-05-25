"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

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
  const [isFocused, setIsFocused] = useState(false)
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
    <motion.form
      onSubmit={handleSubmit}
      className={cn("relative", className)}
      animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative">
        <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="size-4 animate-spin text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Search className="size-4 text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search by ticker (e.g., AAPL) or CIK..."
          className="h-12 pr-24 pl-10 text-base transition-shadow focus-visible:ring-1 focus-visible:ring-primary/20"
          disabled={loading}
        />
        <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1">
          <AnimatePresence>
            {value && !loading && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => {
                  setValue("")
                  inputRef.current?.focus()
                }}
                className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                <X className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>
          <Button
            type="submit"
            disabled={!value.trim() || loading}
            size="sm"
            className="h-9 px-4"
          >
            Search
          </Button>
        </div>
      </div>
    </motion.form>
  )
}
