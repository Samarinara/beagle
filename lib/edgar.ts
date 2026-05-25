import type { Company, Filing } from "./types"

interface TickerEntry {
  cik_str: number
  ticker: string
  title: string
}

interface SubmissionsResponse {
  cik: string
  name: string
  filings: {
    recent: {
      accessionNumber: string[]
      filingDate: string[]
      reportDate: string[]
      form: string[]
      primaryDocument: string[]
      primaryDocDescription: string[]
    }
  }
}

let tickersCache: Record<string, TickerEntry> | null = null

async function fetchTickers(): Promise<Record<string, TickerEntry>> {
  if (tickersCache) return tickersCache

  const res = await fetch("/api/tickers")

  if (res.status === 429) {
    throw new Error(
      "SEC rate limit exceeded. Please wait a moment and try again.",
    )
  }
  if (!res.ok) {
    throw new Error("Failed to fetch company directory from SEC")
  }

  tickersCache = await res.json()
  return tickersCache!
}

export async function searchCompany(query: string): Promise<Company> {
  const trimmed = query.trim()

  if (/^\d{1,10}$/.test(trimmed)) {
    const cik = parseInt(trimmed, 10)
    const tickers = await fetchTickers()
    const entry = Object.values(tickers).find((t) => t.cik_str === cik)
    if (entry) {
      return { cik, ticker: entry.ticker, name: entry.title }
    }
    return { cik, ticker: "", name: `CIK ${trimmed}` }
  }

  const tickers = await fetchTickers()
  const upper = trimmed.toUpperCase()
  const entry = Object.values(tickers).find((t) => t.ticker === upper)

  if (!entry) {
    throw new Error(
      `No company found for "${trimmed}". Try a stock ticker (e.g., AAPL) or CIK number.`,
    )
  }

  return { cik: entry.cik_str, ticker: entry.ticker, name: entry.title }
}

export async function fetchFilings(
  cik: number,
): Promise<{ name: string; filings: Filing[] }> {
  const res = await fetch(`/api/filings/${cik}`)

  if (res.status === 429) {
    throw new Error(
      "SEC rate limit exceeded. Please wait a moment and try again.",
    )
  }
  if (!res.ok) {
    throw new Error("Failed to fetch filings from SEC")
  }

  const data: SubmissionsResponse = await res.json()
  const recent = data.filings?.recent

  if (!recent || !recent.form?.length) {
    throw new Error("No filings found for this company")
  }

  const filings: Filing[] = []
  for (let i = 0; i < recent.form.length; i++) {
    filings.push({
      accessionNumber: recent.accessionNumber[i],
      filingDate: recent.filingDate[i],
      reportDate: recent.reportDate[i],
      form: recent.form[i],
      primaryDocument: recent.primaryDocument[i],
      description: recent.primaryDocDescription?.[i] || "",
    })
  }

  return { name: data.name, filings }
}

export function buildDocumentPath(
  cik: number,
  accessionNumber: string,
  primaryDocument: string,
): string {
  const acc = accessionNumber.replace(/-/g, "")
  return `/api/document/${cik}/${acc}/${primaryDocument}`
}

export function buildSecDirectUrl(
  cik: number,
  accessionNumber: string,
  primaryDocument: string,
): string {
  const acc = accessionNumber.replace(/-/g, "")
  return `https://www.sec.gov/Archives/edgar/data/${cik}/${acc}/${primaryDocument}`
}

export function buildSecBaseUrl(
  cik: number,
  accessionNumber: string,
): string {
  const acc = accessionNumber.replace(/-/g, "")
  return `https://www.sec.gov/Archives/edgar/data/${cik}/${acc}/`
}
