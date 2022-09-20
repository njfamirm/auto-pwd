import {createLogger} from '@alwatr/logger';

if (
  !(
    (process.env.ACCOUNT_ID !== undefined && process.env.ACCOUNT_PASSWORD !== undefined) ||
    process.env.ACCOUNT_COOKIE !== undefined
  )
) {
  throw new Error('Please set ACCOUNT_ID and ACCOUNT_PASSWORD or ACCOUNT_COOKIE');
}

export const config = {
  name: process.env.NAME ?? 'PWDCrawler',
  headless: Boolean(process.env.HEADLESS) ?? true,
  devtool: Boolean(process.env.DEV_TOOL) ?? false,
  account: {
    id: process.env.ACCOUNT_ID,
    password: process.env.ACCOUNT_PASSWORD,
    cookie: process.env.ACCOUNT_COOKIE,
  },
};

export const logger = createLogger(config.name);
