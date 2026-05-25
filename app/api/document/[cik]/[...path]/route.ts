import { NextRequest, NextResponse } from "next/server"

const USER_AGENT = "Beagle EDGAR Explorer (beagle@example.com)"

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ cik: string; path: string[] }>
  },
) {
  const { cik, path } = await params
  const filePath = path.join("/")
  const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${filePath}`

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: response.status },
    )
  }

  const text = await response.text()

  return new NextResponse(text, {
    headers: {
      "Content-Type": response.headers.get("content-type") || "text/html",
    },
  })
}
