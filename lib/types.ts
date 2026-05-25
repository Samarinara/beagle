export interface Company {
  cik: number
  ticker: string
  name: string
}

export interface Filing {
  accessionNumber: string
  filingDate: string
  reportDate: string
  form: string
  primaryDocument: string
  description: string
}
