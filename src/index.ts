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

const OLD_PAGES = [
  'about',
  'contact',
  'services',
  'blog',
  'portfolio'
];

const NEW_PAGES = [
  'about',
  'contact',
  'services',
  'blog',
  'portfolio'
];

async function runPageSpeed(url: string) {
  console.log(`⏳ Analyzing: ${url}`);
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
    console.log(`✅ Completed: ${url} - Performance: ${perf.toFixed(0)}`);
    return result;
  } catch (err) {
    console.error(`❌ Failed: ${url} - ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { url, error: true };
  }
}

async function generateReport() {
  console.log(`\n📋 Analyzing ${OLD_PAGES.length} old pages...`);
  const oldResults = await Promise.all(OLD_PAGES.map((slug) => runPageSpeed(`${OLD_BASE_URL}/${slug}`)));

  console.log(`\n📋 Analyzing ${NEW_PAGES.length} new pages...`);
  const newResults = await Promise.all(NEW_PAGES.map((slug) => runPageSpeed(`${NEW_BASE_URL}/${slug}`)));

  console.log("\n📝 Generating HTML report...");
  const templateSource = fs.readFileSync("src/reportTemplate.hbs", "utf-8");
  const template = Handlebars.compile(templateSource);

  Handlebars.registerHelper("scoreClass", (score: number) => {
    if (score >= 90) return "score-good";
    if (score >= 50) return "score-medium";
    return "score-bad";
  });

  const html = template({
    totalPages: OLD_PAGES.length + NEW_PAGES.length,
    results: [
      { title: "Old Pages", pages: oldResults },
      { title: "New Pages", pages: newResults }
    ]
  });

  fs.writeFileSync("output/report.html", html);

  const totalPages = oldResults.length + newResults.length;
  const failedPages = [...oldResults, ...newResults].filter(r => 'error' in r && r.error).length;

  console.log("\n" + "=".repeat(50));
  console.log("✨ Report generated successfully!");
  console.log(`📄 Location: output/report.html`);
  console.log(`📊 Total pages analyzed: ${totalPages}`);
  if (failedPages > 0) {
    console.log(`⚠️  Failed pages: ${failedPages}`);
  }
  console.log("=".repeat(50));
}

generateReport().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
