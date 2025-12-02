import { runPageSpeed, PageSpeedResult, PageSpeedError } from "./pagespeed.service.js";

export interface PageComparison {
  slug: string;
  pageName: string;
  old: PageSpeedResult | PageSpeedError;
  new: PageSpeedResult | PageSpeedError;
}

export async function* processPagesInBatches(
  slugs: string[],
  oldBaseUrl: string,
  newBaseUrl: string,
  apiKey: string,
  concurrency: number = 3
): AsyncGenerator<PageComparison> {
  const batches: string[][] = [];

  // Create batches
  for (let i = 0; i < slugs.length; i += concurrency) {
    batches.push(slugs.slice(i, i + concurrency));
  }

  // Process each batch
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async (slug) => {
        const oldUrl = `${oldBaseUrl}/${slug}`;
        const newUrl = `${newBaseUrl}/${slug}`;

        // Run old and new in parallel for the same page
        const [oldResult, newResult] = await Promise.all([
          runPageSpeed(oldUrl, 'OLD', apiKey),
          runPageSpeed(newUrl, 'NEW', apiKey)
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
