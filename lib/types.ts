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

export interface FinancialMetric {
  label: string
  value: number | null
  unit: string
  scale: string
  period: string
  statement: string
  fiscalYear?: number
  fiscalPeriod?: string
}

export interface MetricsResponse {
  companyCik: number
  accessionNumber: string
  form: string
  period: string
  metrics: FinancialMetric[]
}
