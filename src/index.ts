import { loadConfig } from "./config/index.js";
import { processPagesInBatches, PageComparison } from "./services/batch-processor.service.js";
import { generateHTMLReport } from "./reporters/html-reporter.js";
import { generateXLSXReport } from "./reporters/xlsx-reporter.js";

const config = loadConfig();

console.log("🚀 PageSpeed Insights Bulk Analysis Started");
console.log(`📊 Old Base URL: ${config.oldBaseUrl}`);
console.log(`📊 New Base URL: ${config.newBaseUrl}`);
console.log(`📄 Output Format: ${config.outputFormat.toUpperCase()}`);

async function generateReport() {
  console.log(`\n📋 Analyzing ${config.pageSlugs.length} pages with optimized parallelism...`);

  const startTime = Date.now();
  const comparisons: PageComparison[] = [];

  // Use generator to process pages in batches with concurrency control
  for await (const comparison of processPagesInBatches(
    config.pageSlugs,
    config.oldBaseUrl,
    config.newBaseUrl,
    config.apiKey,
    3
  )) {
    comparisons.push(comparison);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  Analysis completed in ${elapsed}s`);

  if (config.outputFormat === 'xlsx') {
    generateXLSXReport(comparisons, config.pageSlugs.length, elapsed);
  } else {
    generateHTMLReport(comparisons, config.pageSlugs.length, elapsed);
  }
}

generateReport().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
