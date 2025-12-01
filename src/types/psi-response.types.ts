export type PsiResponse = {
  captchaResult: string;
  kind: string;
  id: string;
  loadingExperience: {
    id: string;
    metrics: {
      FIRST_CONTENTFUL_PAINT_MS: MetricData;
      FIRST_INPUT_DELAY_MS: MetricData;
    };
    overall_category: string;
    initial_url: string;
  };
  originLoadingExperience: {
    id: string;
    metrics: {
      FIRST_CONTENTFUL_PAINT_MS: MetricData;
      FIRST_INPUT_DELAY_MS: MetricData;
    };
    overall_category: string;
    initial_url: string;
  };
  lighthouseResult: {
    requestedUrl: string;
    finalUrl: string;
    lighthouseVersion: string;
    userAgent: string;
    fetchTime: string;
    environment: {
      networkUserAgent: string;
      hostUserAgent: string;
      benchmarkIndex: number;
    };
    runWarnings: string[];
    configSettings: {
      emulatedFormFactor: string;
      locale: string;
      onlyCategories: string[];
    };
    audits: Record<string, Audit>;
    categories: {
      performance: Category;
    };
    categoryGroups: Record<string, CategoryGroup>;
    i18n: {
      rendererFormattedStrings: Record<string, string>;
    };
  };
  analysisUTCTimestamp: string;
};

type MetricData = {
  percentile: number;
  distributions: Distribution[];
  category: string;
};

type Distribution = {
  min?: number;
  max?: number;
  proportion: number;
};

type Audit = {
  id: string;
  title: string;
  description: string;
  score: number;
  scoreDisplayMode: string;
  displayValue?: string;
  details?: {
    headings: any[];
    type: string;
    items: any[];
    overallSavingsMs?: number;
  };
};

type Category = {
  id: string;
  title: string;
  score: number;
  auditRefs: AuditRef[];
};

type AuditRef = {
  id: string;
  weight: number;
  group: string;
};

type CategoryGroup = {
  title: string;
  description: string;
};
