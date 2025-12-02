import fs from "fs";
import Handlebars from "handlebars";
import { PageComparison } from "../services/batch-processor.service.js";
import { PageSpeedResult } from "../services/pagespeed.service.js";

export function generateHTMLReport(
  comparisons: PageComparison[],
  totalPages: number,
  elapsed: string
) {
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
    old: PageSpeedResult;
    new: PageSpeedResult;
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
    totalPages,
    comparisons,
    summary
  });

  fs.writeFileSync("output/report.html", html);

  const totalPagesAnalyzed = totalPages * 2;
  const failedPages = comparisons.reduce((count, c) => {
    return count + ('error' in c.old && c.old.error ? 1 : 0) + ('error' in c.new && c.new.error ? 1 : 0);
  }, 0);

  console.log("\n" + "=".repeat(50));
  console.log("✨ HTML report generated successfully!");
  console.log(`📄 Location: output/report.html`);
  console.log(`📊 Total pages analyzed: ${totalPagesAnalyzed}`);
  console.log(`⚡ Processing time: ${elapsed}s`);
  if (failedPages > 0) {
    console.log(`⚠️  Failed pages: ${failedPages}`);
  }
  console.log("=".repeat(50));
}
