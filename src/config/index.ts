import * as dotenv from "dotenv";

dotenv.config();

export interface Config {
  apiKey: string;
  newBaseUrl: string;
  oldBaseUrl: string;
  outputFormat: 'html' | 'xlsx';
  pageSlugs: string[];
}

function parseCommandLineArgs(): 'html' | 'xlsx' {
  const args = process.argv.slice(2);
  const formatArg = args.find(arg => arg.startsWith('--format='));
  const format = formatArg ? formatArg.split('=')[1].toLowerCase() : 'html';

  if (!['html', 'xlsx'].includes(format)) {
    console.error("Invalid format. Use --format=html or --format=xlsx");
    process.exit(1);
  }

  return format as 'html' | 'xlsx';
}

export function loadConfig(): Config {
  const apiKey = process.env.GOOGLE_PSI_API_KEY;
  const newBaseUrl = process.env.NEW_BASE_URL;
  const oldBaseUrl = process.env.OLD_BASE_URL;

  if (!apiKey) {
    console.error("Missing GOOGLE_PSI_API_KEY in .env");
    process.exit(1);
  }

  const outputFormat = parseCommandLineArgs();

  const pageSlugs = [
    'about'
  ];

  return {
    apiKey,
    newBaseUrl: newBaseUrl || '',
    oldBaseUrl: oldBaseUrl || '',
    outputFormat,
    pageSlugs
  };
}
