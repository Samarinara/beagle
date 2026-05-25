import * as cheerio from "cheerio"
import type { AnyNode } from "domhandler"
import type { FinancialMetric } from "./types"

const USER_AGENT = "Beagle EDGAR Explorer (beagle@example.com)"

const METRIC_LABELS: Record<string, string[]> = {
  Revenue: [
    "net sales", "revenue", "total revenue", "total net sales", "sales",
    "operating revenue", "revenues", "turnover", "total revenues",
    "net revenue", "net revenues", "total operating revenue",
    "sales and service revenue",
  ],
  "Cost of Revenue": [
    "cost of sales", "cost of revenue", "cost of goods sold",
    "cost of products sold", "cost of services", "cost of products and services",
  ],
  "Gross Profit": [
    "gross profit", "gross margin", "gross profit margin",
  ],
  "Research & Development": [
    "research and development", "research & development", "r&d expenses",
    "research and development expense", "r&d",
  ],
  "SG&A": [
    "selling, general and administrative", "selling general and administrative",
    "sga", "selling and administrative", "selling general & administrative",
    "selling and marketing", "general and administrative",
  ],
  "Operating Income": [
    "operating income", "operating profit", "income from operations",
    "operating income (loss)", "profit from operations",
    "operating profit (loss)", "ebit",
  ],
  "Interest Expense": [
    "interest expense", "interest and debt expense", "finance costs",
    "interest expense net", "net interest expense",
    "interest expense, net",
  ],
  "Interest Income": [
    "interest income", "interest and investment income",
    "interest income net", "investment income",
  ],
  "Other Income": [
    "other income (expense), net", "other income net", "other income / (expense)",
    "other income net", "other income expense net",
    "other income, net",
  ],
  "Income Before Tax": [
    "income before provision for income taxes", "income before taxes",
    "income before income taxes", "pretax income", "profit before tax",
    "income before tax", "profit before income taxes",
  ],
  "Tax Provision": [
    "provision for income taxes", "income tax expense", "tax provision",
    "income taxes", "income tax provision", "tax expense",
  ],
  "Net Income": [
    "net income", "net earnings", "net profit", "profit for the period",
    "net income (loss)", "net earnings (loss)", "profit attributable",
    "net profit attributable", "net loss", "income (loss)",
    "profit for the year", "net profit for the period",
  ],
  "Net Income from Continuing Ops": [
    "net income from continuing operations", "income from continuing operations",
    "net earnings from continuing operations",
  ],
  "Earnings Per Share": [
    "earnings per share", "basic earnings per share", "eps",
    "basic eps", "net income per share", "basic net income per share",
    "earnings per share - basic", "earnings per share basic",
  ],
  "Diluted EPS": [
    "diluted earnings per share", "diluted eps",
    "earnings per share - diluted", "earnings per share diluted",
    "diluted net income per share",
  ],
  "Weighted Average Shares": [
    "weighted average shares outstanding", "weighted average shares basic",
    "weighted average shares", "shares used in computing earnings per share basic",
    "basic weighted average shares",
  ],
  "Weighted Average Shares Diluted": [
    "weighted average shares diluted",
    "shares used in computing earnings per share diluted",
    "diluted weighted average shares",
  ],
  EBITDA: [
    "ebitda",
  ],
  "Total Assets": [
    "total assets",
  ],
  "Current Assets": [
    "total current assets",
  ],
  "Cash & Equivalents": [
    "cash and cash equivalents", "cash and equivalents",
    "cash & cash equivalents",
  ],
  "Short-term Investments": [
    "short term marketable securities", "short term investments",
    "marketable securities current", "short-term marketable securities",
  ],
  "Accounts Receivable": [
    "accounts receivable net", "accounts receivable",
    "trade receivables", "receivables net", "trade accounts receivable",
    "trade and other receivables",
  ],
  "Inventories": [
    "inventories", "inventory",
  ],
  "Property Plant & Equipment": [
    "property, plant and equipment net", "property plant and equipment",
    "ppe net", "fixed assets net", "property, plant and equipment, net",
  ],
  "Goodwill": [
    "goodwill",
  ],
  "Intangible Assets": [
    "intangible assets net", "intangible assets",
    "acquired intangible assets",
  ],
  "Long-term Investments": [
    "long term marketable securities", "long term investments",
    "non current marketable securities", "marketable securities non current",
  ],
  "Other Assets": [
    "other non current assets", "other assets",
    "other current assets", "other long term assets",
  ],
  "Current Liabilities": [
    "total current liabilities",
  ],
  "Accounts Payable": [
    "accounts payable", "trade payables",
    "accounts payable trade",
  ],
  "Short-term Debt": [
    "short term debt", "short term borrowings", "commercial paper",
    "current portion of long term debt",
  ],
  "Deferred Revenue": [
    "deferred revenue", "unearned revenue",
    "deferred income",
  ],
  "Long-term Debt": [
    "long term debt", "long term borrowings",
    "non current debt",
  ],
  "Other Liabilities": [
    "other non current liabilities", "other liabilities",
    "other current liabilities", "other long term liabilities",
  ],
  "Total Liabilities": [
    "total liabilities",
  ],
  "Total Equity": [
    "total equity", "total shareholders equity", "total stockholders equity",
    "total shareholders' equity", "total stockholders' equity",
    "shareholders equity", "stockholders equity",
    "total shareholder equity",
  ],
  "Cash From Operations": [
    "net cash provided by operating activities", "cash from operations",
    "cash generated by operating activities",
    "net cash from operating activities",
    "net cash provided by operations",
    "cash provided by operating activities",
    "cash flows from operating activities",
  ],
  "CapEx": [
    "purchases of property plant and equipment", "capital expenditures",
    "capex", "acquisitions of property plant and equipment",
    "payments for acquisition of property plant and equipment",
    "purchase of property and equipment",
  ],
  "Cash From Investing": [
    "net cash used in investing activities", "cash from investing",
    "cash flows from investing activities",
    "net cash from investing activities",
    "cash used in investing activities",
  ],
  "Cash From Financing": [
    "net cash used in financing activities", "cash from financing",
    "cash flows from financing activities",
    "net cash from financing activities",
    "cash used in financing activities",
  ],
  "Free Cash Flow": [
    "free cash flow",
  ],
  "Stock-based Compensation": [
    "share based compensation", "stock based compensation",
    "share-based compensation expense", "stock-based compensation expense",
  ],
  "Depreciation & Amortization": [
    "depreciation and amortization", "depreciation & amortization",
    "depreciation", "amortization",
  ],
  "Dividends Paid": [
    "dividends paid", "cash dividends paid",
    "payments for dividends and dividend equivalents",
    "common stock dividends",
  ],
  "Share Repurchases": [
    "repurchases of common stock", "share repurchases", "stock repurchases",
    "buyback of common stock", "treasury stock purchases",
  ],
  "Net Change in Cash": [
    "increase decrease in cash", "net change in cash",
    "increase (decrease) in cash", "change in cash",
  ],
}

const STATEMENT_KEYWORDS: Record<string, string[]> = {
  income_statement: [
    "net sales", "revenue", "cost of sales", "cost of revenue",
    "gross profit", "operating income", "net income",
    "income before", "provision for income taxes",
    "earnings per share", "selling, general", "research and development",
    "interest expense", "other income", "diluted eps",
    "total operating expenses", "income from operations",
  ],
  balance_sheet: [
    "total assets", "total liabilities", "shareholders equity",
    "stockholders equity", "current assets", "current liabilities",
    "accounts payable", "accounts receivable", "goodwill",
    "intangible assets", "property plant", "cash and cash",
    "long term debt", "short term debt", "inventories",
    "deferred revenue", "accumulated deficit",
  ],
  cash_flow: [
    "net cash provided by", "cash generated by operating",
    "cash flows from operating", "cash flows from investing",
    "cash flows from financing", "depreciation and amortization",
    "purchases of marketable securities", "capital expenditures",
    "dividends paid", "share repurchases", "stock based compensation",
    "net change in cash",
  ],
}

interface ScoredTable {
  element: cheerio.Cheerio<AnyNode>
  score: number
  statement: string | null
  rows: TableRow[]
  scale: string
}

interface TableRow {
  label: string
  values: string[]
  isHeader: boolean
}

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[:\s]+/g, " ")
    .replace(/[^a-z0-9\s()\/-]/g, "")
    .trim()
}

function parseNumber(raw: string): number | null {
  let s = raw.trim()
  if (!s) return null

  const negative = s.startsWith("(") && s.endsWith(")")
  if (negative) {
    s = s.slice(1, -1)
  }

  s = s.replace(/^[$£€¥]/, "").replace(/,/g, "").trim()

  const num = parseFloat(s)
  if (isNaN(num)) return null
  return negative ? -num : num
}

function extractTextFromCell($cell: cheerio.Cheerio<AnyNode>): string {
  const text = $cell.text().trim()
  if (text) return text

  const $span = $cell.find("span").first()
  if ($span.length) return $span.text().trim()

  return ""
}

function extractRowsFromTable($: cheerio.CheerioAPI, $table: cheerio.Cheerio<AnyNode>): TableRow[] {
  const rows: TableRow[] = []

  $table.find("tr").each((_i: number, tr: AnyNode) => {
    const $tr = $(tr)
    const $tds = $tr.find("td")
    if ($tds.length < 2) return

    const $firstTd = $tds.first()
    const label = extractTextFromCell($firstTd)
    if (!label) return

    const isHeader = /(ended|september|december|january|february|march|april|may|june|july|august|october|november)/i.test(label)
    const values: string[] = []

    $tds.each((i: number, td: AnyNode) => {
      if (i === 0) return
      const val = extractTextFromCell($(td))
      if (val) values.push(val)
    })

    if (values.length > 0) {
      rows.push({ label: label.trim(), values, isHeader })
    }
  })

  return rows
}

function detectScale($: cheerio.CheerioAPI, $table: cheerio.Cheerio<AnyNode>, rows: TableRow[]): string {
  const tableText = $table.text().toLowerCase()
  if (/\(in millions[^)]*\)/.test(tableText) || /\(unaudited[^)]*\)/.test(tableText) && tableText.includes("million")) {
    return "millions"
  }
  if (/(in thousands|amounts in thousands)/.test(tableText)) return "thousands"
  if (/(in billions|amounts in billions)/.test(tableText)) return "billions"

  for (const row of rows) {
    if (row.isHeader) {
      const t = row.label.toLowerCase()
      if (t.includes("million")) return "millions"
      if (t.includes("thousand")) return "thousands"
      if (t.includes("billion")) return "billions"
    }
  }

  return "units"
}

function scoreTable(
  $: cheerio.CheerioAPI,
  $table: cheerio.Cheerio<AnyNode>,
  rows: TableRow[],
): number {
  if (rows.length < 3) return 0
  if (rows.length > 50) return 0

  let score = 0
  const allLabels = rows.map((r) => r.label.toLowerCase()).join(" ")

  const allValues = rows.flatMap((r) => r.values)
  const dollarCount = allValues.filter((v) => /\$/.test(v) || /^\(?\$/.test(v)).length
  const numericCount = allValues.filter((v) => /[\d,]+/.test(v)).length
  const parentheticalCount = allValues.filter((v) => /^\([\d,]+\)$/.test(v)).length

  if (dollarCount > 3) score += 20
  else if (numericCount > 5) score += 10

  if (parentheticalCount > 0) score += 5

  for (const [, keywords] of Object.entries(STATEMENT_KEYWORDS)) {
    const matchCount = keywords.filter((kw) => allLabels.includes(kw)).length
    if (matchCount >= 2) score += 15 * matchCount
  }

  if (/ended/.test(allLabels)) score += 5

  if (rows.some((r) => r.isHeader)) score += 3

  return score
}

function classifyTable(rows: TableRow[]): string {
  const allLabels = rows.map((r) => r.label.toLowerCase()).join(" ")

  const scores: Record<string, number> = {
    income_statement: 0,
    balance_sheet: 0,
    cash_flow: 0,
  }

  for (const [statement, keywords] of Object.entries(STATEMENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (allLabels.includes(kw)) {
        scores[statement] += kw.split(" ").length
      }
    }
  }

  let best = "income_statement"
  let bestScore = 0
  for (const [s, sc] of Object.entries(scores)) {
    if (sc > bestScore) {
      bestScore = sc
      best = s
    }
  }

  return best
}

function matchMetric(rows: TableRow[]): Map<string, number | null> {
  const result = new Map<string, number | null>()

  for (const row of rows) {
    const normalized = normalizeLabel(row.label)
    if (!normalized) continue

    for (const [metric, synonyms] of Object.entries(METRIC_LABELS)) {
      if (result.has(metric)) continue

      const matched = synonyms.some((syn) => normalized === syn || normalized.startsWith(syn + " ") || normalized.endsWith(" " + syn))
      if (matched && row.values.length > 0) {
        const value = parseNumber(row.values[0])
        if (value !== null) {
          result.set(metric, value)
        }
      }
    }
  }

  return result
}

function extractPeriod(rows: TableRow[]): string {
  for (const row of rows) {
    if (row.isHeader) {
      const t = row.label
      const dateMatch = t.match(/(\w+ \d{1,2},?\s*\d{4})/)
      if (dateMatch) {
        return dateMatch[1]
      }
    }
  }

  for (const row of rows) {
    const t = row.label
    const dateMatch = t.match(/(\w+ \d{1,2},?\s*\d{4})/)
    if (dateMatch) {
      return dateMatch[1]
    }
  }

  return ""
}

export async function fetchDocumentText(
  cik: number,
  accessionNumber: string,
  primaryDocument: string,
): Promise<string> {
  const acc = accessionNumber.replace(/-/g, "")
  const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${acc}/${primaryDocument}`

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch document: ${res.status}`)
  }

  return res.text()
}

function computeDerivedMetrics(
  metrics: Map<string, { value: number | null; statement: string; scale: string }>,
): void {
  const get = (name: string): number | null => metrics.get(name)?.value ?? null
  const set = (name: string, value: number, statement: string, scale: string) => {
    if (!metrics.has(name)) {
      metrics.set(name, { value, statement, scale })
    }
  }

  const cfo = get("Cash From Operations")
  const capex = get("CapEx")
  if (cfo !== null && capex !== null) {
    set("Free Cash Flow (Computed)", cfo - capex, "cash_flow", "units")
  }

  const currentAssets = get("Current Assets")
  const currentLiabilities = get("Current Liabilities")
  if (currentAssets !== null && currentLiabilities !== null) {
    const wc = currentAssets - currentLiabilities
    set("Working Capital", wc, "balance_sheet", "units")
  }
}

export function parseMetricsFromHtml(
  html: string,
): FinancialMetric[] {
  const $ = cheerio.load(html)

  const candidates: ScoredTable[] = []

  $("table").each((_: number, table: AnyNode) => {
    const $table = $(table)
    const rows = extractRowsFromTable($, $table)
    if (rows.length < 3) return

    const score = scoreTable($, $table, rows)
    if (score < 10) return

    const scale = detectScale($, $table, rows)
    const statement = classifyTable(rows)

    candidates.push({ element: $table, score, statement, rows, scale })
  })

  candidates.sort((a, b) => b.score - a.score)

  const topTables = candidates.slice(0, 3)

  const matchedMetrics = new Map<string, { value: number | null; statement: string; scale: string }>()

  for (const table of topTables) {
    const matches = matchMetric(table.rows)
    for (const [metric, value] of matches) {
      if (!matchedMetrics.has(metric)) {
        matchedMetrics.set(metric, { value, statement: table.statement!, scale: table.scale })
      }
    }
  }

  const period = topTables.length > 0 ? extractPeriod(topTables[0].rows) : ""

  computeDerivedMetrics(matchedMetrics)

  const metrics: FinancialMetric[] = []
  for (const [label, info] of matchedMetrics) {
    if (info.value === null) continue

    const unit =
      label === "Earnings Per Share" || label === "Diluted EPS"
        ? "USD/share"
        : label === "Weighted Average Shares" || label === "Weighted Average Shares Diluted"
          ? "shares"
          : "USD"

    metrics.push({
      label,
      value: info.value,
      unit,
      scale: info.scale,
      period,
      statement: info.statement,
    })
  }

  return metrics
}

export async function extractMetricsFromFiling(
  cik: number,
  accessionNumber: string,
  primaryDocument: string,
): Promise<FinancialMetric[]> {
  const html = await fetchDocumentText(cik, accessionNumber, primaryDocument)
  return parseMetricsFromHtml(html)
}
