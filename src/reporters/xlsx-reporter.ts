import * as XLSX from "xlsx";
import { PageComparison } from "../services/batch-processor.service.js";
import { PageSpeedResult } from "../services/pagespeed.service.js";

export function generateXLSXReport(
  comparisons: PageComparison[],
  totalPages: number,
  elapsed: string
) {
  console.log("\n📝 Generating XLSX report...");

  // Filter valid comparisons
  const validComparisons = comparisons.filter(c => !('error' in c.old) && !('error' in c.new));

  // Prepare data for the spreadsheet
  const sheetData: any[][] = [
    // Header row
    [
      'Page Name',
      'Old Performance',
      'New Performance',
      'Old FCP',
      'New FCP',
      'Old LCP',
      'New LCP',
      'Old CLS',
      'New CLS',
      'Old TBT',
      'New TBT',
      'Performance Diff',
      'Status'
    ]
  ];

  // Add data rows
  for (const comp of comparisons) {
    if ('error' in comp.old || 'error' in comp.new) {
      sheetData.push([
        comp.pageName,
        'error' in comp.old ? 'ERROR' : comp.old.performance,
        'error' in comp.new ? 'ERROR' : comp.new.performance,
        'error' in comp.old ? 'N/A' : comp.old.fcp,
        'error' in comp.new ? 'N/A' : comp.new.fcp,
        'error' in comp.old ? 'N/A' : comp.old.lcp,
        'error' in comp.new ? 'N/A' : comp.new.lcp,
        'error' in comp.old ? 'N/A' : comp.old.cls,
        'error' in comp.new ? 'N/A' : comp.new.cls,
        'error' in comp.old ? 'N/A' : comp.old.tbt,
        'error' in comp.new ? 'N/A' : comp.new.tbt,
        'ERROR',
        'Error'
      ]);
    } else {
      const diff = comp.new.performance - comp.old.performance;
      const status = diff > 5 ? 'Improved' : diff < -5 ? 'Regressed' : 'Unchanged';

      sheetData.push([
        comp.pageName,
        comp.old.performance,
        comp.new.performance,
        comp.old.fcp,
        comp.new.fcp,
        comp.old.lcp,
        comp.new.lcp,
        comp.old.cls,
        comp.new.cls,
        comp.old.tbt,
        comp.new.tbt,
        diff.toFixed(2),
        status
      ]);
    }
  }

  // Calculate summary statistics
  if (validComparisons.length > 0) {
    const validTypedComparisons = validComparisons as Array<{
      slug: string;
      pageName: string;
      old: PageSpeedResult;
      new: PageSpeedResult;
    }>;

    const oldAvgPerf = validTypedComparisons.reduce((sum, c) => sum + c.old.performance, 0) / validTypedComparisons.length;
    const newAvgPerf = validTypedComparisons.reduce((sum, c) => sum + c.new.performance, 0) / validTypedComparisons.length;
    const avgImprovement = newAvgPerf - oldAvgPerf;
    const pagesImproved = validTypedComparisons.filter(c => c.new.performance > c.old.performance).length;
    const pagesRegressed = validTypedComparisons.filter(c => c.new.performance < c.old.performance).length;

    // Add summary section
    sheetData.push(
      [],
      ['SUMMARY'],
      ['Total Pages Analyzed', totalPages * 2],
      ['Pages Improved', pagesImproved],
      ['Pages Regressed', pagesRegressed],
      ['Pages Unchanged', validTypedComparisons.length - pagesImproved - pagesRegressed],
      ['Old Average Performance', oldAvgPerf.toFixed(2) + '%'],
      ['New Average Performance', newAvgPerf.toFixed(2) + '%'],
      ['Average Improvement', avgImprovement.toFixed(2) + '%'],
      ['Processing Time (seconds)', elapsed]
    );
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 },  // Page Name
    { wch: 15 },  // Old Performance
    { wch: 15 },  // New Performance
    { wch: 10 },  // Old FCP
    { wch: 10 },  // New FCP
    { wch: 10 },  // Old LCP
    { wch: 10 },  // New LCP
    { wch: 10 },  // Old CLS
    { wch: 10 },  // New CLS
    { wch: 10 },  // Old TBT
    { wch: 10 },  // New TBT
    { wch: 15 },  // Performance Diff
    { wch: 12 }   // Status
  ];

  // Apply styling to cells
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  // Red color for old results (columns B, D, F, H, J)
  const redFont = { color: { rgb: "FF0000" } };
  // Green color for new results (columns C, E, G, I, K)
  const greenFont = { color: { rgb: "008000" } };

  for (let row = 1; row <= range.e.r; row++) { // Start at row 1 to skip header
    // Old columns: B (1), D (3), F (5), H (7), J (9)
    [1, 3, 5, 7, 9].forEach(col => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddress]) return;
      ws[cellAddress].s = { font: redFont };
    });

    // New columns: C (2), E (4), G (6), I (8), K (10)
    [2, 4, 6, 8, 10].forEach(col => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddress]) return;
      ws[cellAddress].s = { font: greenFont };
    });
  }

  XLSX.utils.book_append_sheet(wb, ws, 'PageSpeed Results');
  XLSX.writeFile(wb, 'output/report.xlsx');

  const totalPagesAnalyzed = totalPages * 2;
  const failedPages = comparisons.reduce((count, c) => {
    return count + ('error' in c.old && c.old.error ? 1 : 0) + ('error' in c.new && c.new.error ? 1 : 0);
  }, 0);

  console.log("\n" + "=".repeat(50));
  console.log("✨ XLSX report generated successfully!");
  console.log(`📄 Location: output/report.xlsx`);
  console.log(`📊 Total pages analyzed: ${totalPagesAnalyzed}`);
  console.log(`⚡ Processing time: ${elapsed}s`);
  if (failedPages > 0) {
    console.log(`⚠️  Failed pages: ${failedPages}`);
  }
  console.log("=".repeat(50));
}
