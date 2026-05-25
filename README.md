# Beagle

SEC EDGAR filing explorer. Search companies by ticker or name, browse their SEC filings, and view documents inline.

Built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, and **shadcn/ui**.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and search for a company (e.g. `AAPL`, `MSFT`, `NVDA`).

## Features

- Company search by ticker symbol or name
- Browse filings (10-K, 10-Q, 8-K, etc.) with pagination
- Inline document viewer with HTML rendering
- Dark / light mode
- API route proxy to SEC EDGAR

## Architecture

API routes proxy requests to SEC EDGAR:

| Route                  | Description                               |
| ---------------------- | ----------------------------------------- |
| `GET /api/tickers`     | Look up company CIK by ticker or name     |
| `GET /api/filings/[cik]` | Fetch recent filings for a company      |
| `GET /api/document/[cik]/[...path]` | Fetch a filing document        |

## Scripts

| Command             | Description                |
| ------------------- | -------------------------- |
| `pnpm dev`          | Start dev server           |
| `pnpm build`        | Production build           |
| `pnpm start`        | Start production server    |
| `pnpm lint`         | Run ESLint                 |
| `pnpm format`       | Format with Prettier       |
| `pnpm typecheck`    | Run TypeScript type check  |
