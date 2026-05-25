import * as cheerio from "cheerio"
import type { FinancialMetric } from "./types"

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1/chat/completions"

const MODEL_CONTEXTS: Record<string, number> = {
  "openai/gpt-4o": 128_000,
  "openai/gpt-4o-mini": 128_000,
  "openai/gpt-4.1": 1_047_576,
  "anthropic/claude-sonnet-4": 200_000,
  "anthropic/claude-sonnet-4-20250514": 200_000,
  "anthropic/claude-3.5-sonnet": 200_000,
  "google/gemini-2.5-pro": 1_048_576,
  "google/gemini-2.5-flash": 1_048_576,
  "deepseek/deepseek-v4-flash": 1_000_000,
  "deepseek/deepseek-v4-pro": 1_000_000,
  "qwen/qwen3.6-plus-preview": 1_000_000,
  "meta-llama/llama-4-scout": 256_000,
  "mistral/mistral-large-2501": 128_000,
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-4o": { input: 2.5, output: 10 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
  "anthropic/claude-sonnet-4": { input: 3, output: 15 },
  "google/gemini-2.5-pro": { input: 1.25, output: 10 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "deepseek/deepseek-v4-flash": { input: 0.15, output: 0.6 },
  "deepseek/deepseek-v4-pro": { input: 0.435, output: 0.87 },
  "qwen/qwen3.6-plus-preview": { input: 0, output: 0 },
}

export function getModelContextWindow(model: string): number {
  for (const [key, ctx] of Object.entries(MODEL_CONTEXTS)) {
    if (model.includes(key) || key.includes(model)) return ctx
  }
  return 128_000
}

export function getModelPricing(model: string): { input: number; output: number } {
  for (const [key, price] of Object.entries(MODEL_PRICING)) {
    if (model.includes(key) || key.includes(model)) return price
  }
  return { input: 0, output: 0 }
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function minimizeFilingText(html: string, aggressive = false): string {
  const $ = cheerio.load(html)

  $("script, style, noscript, iframe, svg, link, meta, comment, source, track").remove()

  if (aggressive) {
    $("nav, footer, header, .mailer, .formGroup, .toolbar").remove()
  }

  const $body = $("body")
  let text: string
  if ($body.length) {
    text = $body.text()
  } else {
    text = $.root().text() || ""
  }

  text = text.replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim()

  if (aggressive) {
    const lines = text.split("\n")
    const kept: string[] = []
    let inExhibit = false
    for (const line of lines) {
      if (/^EXHIBIT\s+\d/i.test(line.trim())) inExhibit = true
      if (inExhibit && /SIGNATURE/i.test(line.trim())) inExhibit = false
      if (!inExhibit) kept.push(line)
    }
    text = kept.join("\n")
  }

  return text
}

const EXTRACTION_PROMPT = `You are a financial analyst extracting quantitative data from an SEC filing. Extract ALL financial metrics from the document below.

For each metric, output a JSON object with these fields:
- "label": the exact line item name as written (e.g., "Revenue", "Net income attributable to common stockholders")
- "value": the numeric value (as a number, not a string). Use negative for losses/deficits. If a value appears in parentheses like (1,234), treat it as negative.
- "unit": one of "USD", "shares", "USD/share", "percent", "days", or null
- "scale": one of "units", "thousands", "millions", "billions" — determine this from the table headers or context (e.g., "in millions" means scale is "millions")
- "period": the date this metric is as of or for the period ended
- "statement": one of "income_statement", "balance_sheet", "cash_flow", "other"

IMPORTANT RULES:
- Extract EVERY row that has a dollar amount or numeric value from every financial table.
- Include subtotals and totals (e.g., "Total assets", "Gross profit", "Net cash provided by operating activities").
- Include per-share data, weighted average shares, employee metrics, segment data — everything quantitative.
- Extract values for ALL periods shown, not just the most recent.
- If a metric appears for multiple periods, return it multiple times with different period values.
- Pay attention to whether values are in millions/thousands/units — look for notes like "(in millions)" in headers.
- Convert everything to the scale indicated by the table header (e.g., if table says "in millions", set scale to "millions" and use the raw number from the table).

Return ONLY a JSON object with a single key "metrics" containing an array of metric objects.
Example:
{"metrics": [{"label": "Revenue", "value": 123456, "unit": "USD", "scale": "millions", "period": "2024-12-31", "statement": "income_statement"}]}

DOCUMENT TEXT:
`

export async function extractMetricsWithLLM(
  text: string,
  apiKey: string,
  model: string,
): Promise<{ metrics: FinancialMetric[]; estimatedInputTokens: number }> {
  const estimatedInputTokens = estimateTokens(text)

  const maxTokens = Math.min(16000, Math.floor(estimateTokens(EXTRACTION_PROMPT) + estimatedInputTokens * 0.3))

  const response = await fetch(OPENROUTER_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://github.com/samarinara/beagle",
      "X-Title": "Beagle EDGAR Explorer",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a precise financial data extraction assistant. You always respond with valid JSON. Extract all quantitative metrics from SEC filings accurately.",
        },
        {
          role: "user",
          content: EXTRACTION_PROMPT + text,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`OpenRouter API error (${response.status}): ${body}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("OpenRouter returned empty response")
  }

  let parsed: { metrics: FinancialMetric[] }
  try {
    parsed = JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        throw new Error("Failed to parse LLM response as JSON")
      }
    } else {
      throw new Error("Failed to parse LLM response as JSON")
    }
  }

  const metrics = (parsed.metrics || []).map((m: Partial<FinancialMetric>) => ({
    label: m.label || "Unknown",
    value: typeof m.value === "number" ? m.value : null,
    unit: m.unit || "USD",
    scale: m.scale || "units",
    period: m.period || "",
    statement: m.statement || "other",
  }))

  return { metrics, estimatedInputTokens }
}
