# PageSpeed Insights - Multiple Pages

A TypeScript-based tool that runs Google PageSpeed Insights analysis on multiple pages in parallel and generates comparative performance reports.

## Overview

This project enables bulk performance analysis by running PageSpeed Insights tests on multiple URLs simultaneously. It aggregates and compares performance metrics, accessibility scores, and optimization data across all analyzed pages, making it easy to identify performance trends and issues across your entire site.

![PageSpeed Insights Comparison Report](docs/screenshots/home.png)

## Features

- 🚀 Parallel processing of multiple URLs for faster analysis
- 📊 Fetches performance data from Google PageSpeed Insights API
- 📱 Supports both mobile and desktop analysis
- 📈 Generates comparative reports in HTML or XLSX format
- 🔄 Compare performance across multiple pages side-by-side
- 📊 Excel export for easy data analysis and sharing
- 🎨 Clean, formatted output using Handlebars templates
- 🔧 TypeScript for type safety and better developer experience

## Prerequisites

- Node.js (v14 or higher recommended)
- Google PageSpeed Insights API key ([get one here](https://developers.google.com/speed/docs/insights/v5/get-started))

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file:

```bash
cp .env.example .env
```

4. Add your PageSpeed Insights API key to the `.env` file:

```
PSI_API_KEY=your_api_key_here
```

## Usage

Edit the `src/config/index.ts` file to add the pages you want to analyze.

```typescript
const pageSlugs = [
  'about'
];
```

Run the tool with HTML output (default):

```bash
npm start
# or
npm run start:html
```

Run the tool with XLSX (Excel) output:

```bash
npm run start:xlsx
```

Or use the format flag directly:

```bash
npm start -- --format=html
npm start -- --format=xlsx
```

The generated report will be saved in the [`output`](output) directory as either `report.html` or `report.xlsx`.

## Project Structure

```
├── src/
│   ├── index.ts              # Main entry point
│   ├── reportTemplate.hbs    # Handlebars template for HTML reports
│   ├── helpers/              # Helper functions
│   └── types/                # TypeScript type definitions
├── output/                   # Generated reports directory
├── .env.example              # Environment variables template
└── tsconfig.json             # TypeScript configuration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## API Reference

This project uses the [Google PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started).
