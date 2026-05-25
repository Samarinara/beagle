import { NextResponse } from "next/server"

const USER_AGENT = "Beagle EDGAR Explorer (beagle@example.com)"

export async function GET() {
  const res = await fetch(
    "https://www.sec.gov/files/company_tickers.json",
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
      { error: "Failed to fetch company directory from SEC" },
      { status: res.status },
    )
  }

  const data = await res.json()
  return NextResponse.json(data)
}
