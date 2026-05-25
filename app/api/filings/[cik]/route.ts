import { NextResponse } from "next/server"

const USER_AGENT = "Beagle EDGAR Explorer (beagle@example.com)"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cik: string }> },
) {
  const { cik } = await params
  const padded = cik.padStart(10, "0")

  const res = await fetch(
    `https://data.sec.gov/submissions/CIK${padded}.json`,
    {
      headers: { "User-Agent": USER_AGENT },
    },
  )

  if (res.status === 429) {
    return NextResponse.json(
      { error: "SEC rate limit exceeded. Please wait a moment and try again." },
      { status: 429 },
    )
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch filings from SEC" },
      { status: res.status },
    )
  }

  const data = await res.json()
  return NextResponse.json(data)
}
