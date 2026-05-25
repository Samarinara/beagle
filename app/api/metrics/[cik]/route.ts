import { NextRequest, NextResponse } from "next/server"
import { extractMetricsFromFiling, fetchDocumentText } from "@/lib/metrics"
import { extractMetricsWithLLM, minimizeFilingText, estimateTokens } from "@/lib/openrouter"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cik: string }> },
) {
  const { cik } = await params
  const { searchParams } = new URL(_request.url)
  const accessionNumber = searchParams.get("accessionNumber")
  const primaryDocument = searchParams.get("primaryDocument")
  const form = searchParams.get("form") || ""
  const mode = searchParams.get("mode") || "rule"
  const openRouterKey = searchParams.get("openRouterKey")
  const model = searchParams.get("model")

  if (!accessionNumber || !primaryDocument) {
    return NextResponse.json(
      { error: "Missing required query parameters: accessionNumber, primaryDocument" },
      { status: 400 },
    )
  }

  try {
    const cikNum = parseInt(cik, 10)

    if (mode === "rule") {
      const metrics = await extractMetricsFromFiling(cikNum, accessionNumber, primaryDocument)
      return NextResponse.json({
        companyCik: cikNum,
        accessionNumber,
        form,
        period: "",
        metrics,
        extractionMethod: "rule" as const,
      })
    }

    const html = await fetchDocumentText(cikNum, accessionNumber, primaryDocument)
    const text = minimizeFilingText(html, false)
    const estimatedTokens = estimateTokens(text)

    if (mode === "estimate") {
      return NextResponse.json({ estimatedTokens, extractionMethod: "estimate" as const })
    }

    if (!openRouterKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is required for LLM extraction" },
        { status: 400 },
      )
    }

    if (!model) {
      return NextResponse.json(
        { error: "Model is required for LLM extraction" },
        { status: 400 },
      )
    }

    const result = await extractMetricsWithLLM(text, openRouterKey, model)

    return NextResponse.json({
      companyCik: cikNum,
      accessionNumber,
      form,
      period: "",
      metrics: result.metrics,
      estimatedTokens: result.estimatedInputTokens,
      extractionMethod: "llm" as const,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract metrics"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
