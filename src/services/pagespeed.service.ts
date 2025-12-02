import { PsiResponse } from "../types/psi-response.types.js";

export interface PageSpeedResult {
  url: string;
  performance: number;
  fcp: string | undefined;
  lcp: string | undefined;
  cls: string | undefined;
  tbt: string | undefined;
}

export interface PageSpeedError {
  url: string;
  error: true;
}

export async function runPageSpeed(
  url: string,
  label: string,
  apiKey: string
): Promise<PageSpeedResult | PageSpeedError> {
  console.log(`⏳ Analyzing [${label}]: ${url}`);
  try {
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&strategy=mobile&key=${apiKey}`;

    const res = await fetch(endpoint);
    const data = await res.json() as PsiResponse;

    const lighthouse = data.lighthouseResult;

    const perf = lighthouse.categories.performance.score * 100;
    const audits = lighthouse.audits;

    const result: PageSpeedResult = {
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
