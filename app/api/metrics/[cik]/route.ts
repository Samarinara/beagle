import { NextRequest, NextResponse } from "next/server"
import { extractMetricsFromFiling } from "@/lib/metrics"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cik: string }> },
) {
  const { cik } = await params
  const { searchParams } = new URL(_request.url)
  const accessionNumber = searchParams.get("accessionNumber")
  const primaryDocument = searchParams.get("primaryDocument")
  const form = searchParams.get("form") || ""

  if (!accessionNumber || !primaryDocument) {
    return NextResponse.json(
      { error: "Missing required query parameters: accessionNumber, primaryDocument" },
      { status: 400 },
    )
  }

  try {
    const metrics = await extractMetricsFromFiling(
      parseInt(cik, 10),
      accessionNumber,
      primaryDocument,
    )

    return NextResponse.json({
      companyCik: parseInt(cik, 10),
      accessionNumber,
      form,
      period: "",
      metrics,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract metrics"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
