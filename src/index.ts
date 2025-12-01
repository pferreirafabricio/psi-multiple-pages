import * as dotenv from "dotenv";
import fs from "fs";
import Handlebars from "handlebars";
import { PsiResponse } from "./types/psi-response.types";

dotenv.config();

const API_KEY = process.env.GOOGLE_PSI_API_KEY;
const NEW_BASE_URL = process.env.NEW_BASE_URL;
const OLD_BASE_URL = process.env.OLD_BASE_URL;

if (!API_KEY) {
  console.error("Missing GOOGLE_PSI_API_KEY in .env");
  process.exit(1);
}

console.log("🚀 PageSpeed Insights Bulk Analysis Started");
console.log(`📊 Old Base URL: ${OLD_BASE_URL}`);
console.log(`📊 New Base URL: ${NEW_BASE_URL}`);

const PAGES_SLUGS = [
  'about'
];

async function runPageSpeed(url: string, label: string) {
  console.log(`⏳ Analyzing [${label}]: ${url}`);
  try {
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&strategy=mobile&key=${API_KEY}`;

    const res = await fetch(endpoint);
    const data = await res.json() as PsiResponse;

    const lighthouse = data.lighthouseResult;

    const perf = lighthouse.categories.performance.score * 100;
    const audits = lighthouse.audits;

    const result = {
      url,
      performance: perf,
      fcp: audits["first-contentful-paint"].displayValue,
      lcp: audits["largest-contentful-paint"].displayValue,
      cls: audits["cumulative-layout-shift"].displayValue,
      tbt: audits["total-blocking-time"].displayValue
    };
    console.log(`✅ Completed [${label}]: ${url} - Performance: ${perf.toFixed(0)}`);
    return result;
  } catch (err) {
    console.error(`❌ Failed [${label}]: ${url} - ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { url, error: true };
  }
}

// Generator function to process pages in batches with concurrency limit
async function* processPagesInBatches(
  slugs: string[],
  concurrency: number = 3
): AsyncGenerator<{ slug: string; old: any; new: any; pageName: string }> {
  const batches: string[][] = [];

  // Create batches
  for (let i = 0; i < slugs.length; i += concurrency) {
    batches.push(slugs.slice(i, i + concurrency));
  }

  // Process each batch
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async (slug) => {
        const oldUrl = `${OLD_BASE_URL}/${slug}`;
        const newUrl = `${NEW_BASE_URL}/${slug}`;

        // Run old and new in parallel for the same page
        const [oldResult, newResult] = await Promise.all([
          runPageSpeed(oldUrl, 'OLD'),
          runPageSpeed(newUrl, 'NEW')
        ]);

        const pageName = slug.split('/').pop() || slug;
        const formattedName = pageName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return {
          slug,
          pageName: formattedName,
          old: oldResult,
          new: newResult
        };
      })
    );

    // Yield results as they complete
    for (const result of batchResults) {
      yield result;
    }
  }
}

async function generateReport() {
  console.log(`\n📋 Analyzing ${PAGES_SLUGS.length} pages with optimized parallelism...`);

  const startTime = Date.now();
  const comparisons: Array<{ slug: string; pageName: string; old: any; new: any }> = [];

  // Use generator to process pages in batches with concurrency control
  for await (const comparison of processPagesInBatches(PAGES_SLUGS, 3)) {
    comparisons.push(comparison);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  Analysis completed in ${elapsed}s`);

  console.log("\n📝 Generating HTML report...");
  const templateSource = fs.readFileSync("src/reportTemplate.hbs", "utf-8");
  const template = Handlebars.compile(templateSource);

  Handlebars.registerHelper("scoreClass", (score: number) => {
    if (score >= 90) return "score-good";
    if (score >= 50) return "score-medium";
    return "score-bad";
  });

  Handlebars.registerHelper("diffClass", (oldScore: number, newScore: number) => {
    const diff = newScore - oldScore;
    if (diff > 5) return "diff-improved";
    if (diff < -5) return "diff-worse";
    return "diff-neutral";
  });

  Handlebars.registerHelper("diffValue", (oldScore: number, newScore: number) => {
    const diff = newScore - oldScore;
    const prefix = diff > 0 ? "+" : "";
    return `${prefix}${diff.toFixed(2)}`;
  });

  Handlebars.registerHelper("round", (value: number) => {
    return value.toFixed(2);
  });

  Handlebars.registerHelper("gt", (a: number, b: number) => {
    return a > b;
  });

  // Sort by new performance score (best first)
  comparisons.sort((a, b) => {
    const aScore = 'error' in a.new ? 0 : a.new.performance;
    const bScore = 'error' in b.new ? 0 : b.new.performance;
    return bScore - aScore;
  });

  // Calculate summary statistics
  const validComparisons = comparisons.filter(c => !('error' in c.old) && !('error' in c.new)) as Array<{
    slug: string;
    pageName: string;
    old: { url: string; performance: number; fcp: string | undefined; lcp: string | undefined; cls: string | undefined; tbt: string | undefined };
    new: { url: string; performance: number; fcp: string | undefined; lcp: string | undefined; cls: string | undefined; tbt: string | undefined };
  }>;

  const oldAvgPerf = validComparisons.reduce((sum, c) => sum + c.old.performance, 0) / validComparisons.length;
  const newAvgPerf = validComparisons.reduce((sum, c) => sum + c.new.performance, 0) / validComparisons.length;
  const avgImprovement = newAvgPerf - oldAvgPerf;
  const improvementPercent = (avgImprovement / oldAvgPerf) * 100;
  const pagesImproved = validComparisons.filter(c => c.new.performance > c.old.performance).length;
  const pagesRegressed = validComparisons.filter(c => c.new.performance < c.old.performance).length;

  const summary = {
    oldAvgPerf: oldAvgPerf.toFixed(2),
    newAvgPerf: newAvgPerf.toFixed(2),
    avgImprovement: avgImprovement.toFixed(2),
    improvementPercent: improvementPercent.toFixed(2),
    pagesImproved,
    pagesRegressed,
    pagesUnchanged: validComparisons.length - pagesImproved - pagesRegressed
  };

  const html = template({
    totalPages: PAGES_SLUGS.length,
    comparisons,
    summary
  });

  fs.writeFileSync("output/report.html", html);

  const totalPages = PAGES_SLUGS.length * 2;
  const failedPages = comparisons.reduce((count, c) => {
    return count + ('error' in c.old && c.old.error ? 1 : 0) + ('error' in c.new && c.new.error ? 1 : 0);
  }, 0);

  console.log("\n" + "=".repeat(50));
  console.log("✨ Report generated successfully!");
  console.log(`📄 Location: output/report.html`);
  console.log(`📊 Total pages analyzed: ${totalPages}`);
  console.log(`⚡ Processing time: ${elapsed}s`);
  if (failedPages > 0) {
    console.log(`⚠️  Failed pages: ${failedPages}`);
  }
  console.log("=".repeat(50));
}

generateReport().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
